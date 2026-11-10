import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import BlogModel, { IContentBlock } from "@/app/models/blogModel";

/**
 * Helper to convert legacy HTML `content` into structured `IContentBlock[]`.
 * - "single-block": Wraps the entire HTML content into a single `text` block.
 * - "split-images": Extracts inline `<img>` tags and pairs them with following text as `imageText` (`img-left`) blocks,
 *   matching Wifey's legacy float-left image layout.
 */
function convertHtmlToBlocks(
  htmlContent: string,
  arabicContent?: string,
  mode: "single-block" | "split-images" = "split-images"
): IContentBlock[] {
  const cleanHtml = (htmlContent || "").trim();
  if (!cleanHtml) {
    return [];
  }

  if (mode === "single-block") {
    return [
      {
        type: "text",
        textHtml: cleanHtml,
        ...(arabicContent ? { arabicContent } : {}),
      },
    ];
  }

  // Check if there are any <img> tags in the HTML
  const imgRegex = /<img\b[^>]*>/gi;
  if (!imgRegex.test(cleanHtml)) {
    return [
      {
        type: "text",
        textHtml: cleanHtml,
        ...(arabicContent ? { arabicContent } : {}),
      },
    ];
  }

  // Split HTML around <img ...> tags while keeping the matches
  const blocks: IContentBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = /<img\b[^>]*>/gi;

  const segments: Array<{ type: "html" | "img"; value: string; src?: string; alt?: string }> = [];

  while ((match = regex.exec(cleanHtml)) !== null) {
    const before = cleanHtml.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push({ type: "html", value: before });
    }
    const imgTag = match[0];
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
    if (srcMatch && srcMatch[1]) {
      segments.push({
        type: "img",
        value: imgTag,
        src: srcMatch[1],
        alt: altMatch ? altMatch[1] : "",
      });
    }
    lastIndex = regex.lastIndex;
  }

  const remaining = cleanHtml.slice(lastIndex).trim();
  if (remaining) {
    segments.push({ type: "html", value: remaining });
  }

  // Clean up empty wrapper tags left after removing <img>
  const isMeaningfulHtml = (html: string) => {
    const stripped = html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim();
    return stripped.length > 0;
  };

  let i = 0;
  while (i < segments.length) {
    const current = segments[i];
    if (current.type === "html") {
      if (isMeaningfulHtml(current.value)) {
        blocks.push({
          type: "text",
          textHtml: current.value,
        });
      }
      i++;
    } else if (current.type === "img" && current.src) {
      const next = segments[i + 1];
      if (next && next.type === "html" && isMeaningfulHtml(next.value)) {
        blocks.push({
          type: "imageText",
          layout: "img-left",
          imageUrl: current.src,
          alt: current.alt || "",
          textHtml: next.value,
        });
        i += 2;
      } else {
        blocks.push({
          type: "image",
          layout: "img-block",
          imageUrl: current.src,
          alt: current.alt || "",
        });
        i++;
      }
    } else {
      i++;
    }
  }

  // Attach arabicContent to the first text-capable block if available
  if (arabicContent && blocks.length > 0) {
    const firstTextBlock = blocks.find(
      (b) => b.type === "text" || b.type === "imageText"
    );
    if (firstTextBlock) {
      firstTextBlock.arabicContent = arabicContent;
    } else {
      blocks.push({
        type: "text",
        textHtml: "",
        arabicContent,
      });
    }
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          type: "text",
          textHtml: cleanHtml,
          ...(arabicContent ? { arabicContent } : {}),
        },
      ];
}

// GET - Dry-run preview of blog migration status
export async function GET() {
  await ConnectDB();
  try {
    const blogs = await BlogModel.find({}).sort({ createdAt: -1 });

    const summary = {
      totalBlogs: blogs.length,
      alreadyHasBlocks: 0,
      needsMigration: 0,
      hasInlineImages: 0,
      hasLegacyArabicTranslations: 0,
    };

    const preview = blogs.map((blog: any) => {
      const existingBlocks = blog.v2?.blocks || blog.blocks;
      const hasBlocks = Array.isArray(existingBlocks) && existingBlocks.length > 0;
      const hasImages = /<img\b[^>]*>/i.test(blog.content || "");
      const hasArTranslation = !!(
        blog.v2?.titleAR ||
        blog.translations?.ar?.title ||
        blog.translations?.ar?.excerpt ||
        blog.translations?.ar?.content
      );

      if (hasBlocks) summary.alreadyHasBlocks++;
      else summary.needsMigration++;

      if (hasImages) summary.hasInlineImages++;
      if (hasArTranslation) summary.hasLegacyArabicTranslations++;

      const proposedBlocksSplit = convertHtmlToBlocks(
        blog.content || "",
        blog.v2?.blocks?.[0]?.arabicContent || blog.translations?.ar?.content,
        "split-images"
      );

      return {
        _id: blog._id,
        title: blog.title,
        titleAR: blog.v2?.titleAR || blog.titleAR || blog.translations?.ar?.title || "",
        slug: blog.slug,
        status: blog.status,
        hasExistingBlocks: hasBlocks,
        existingBlocksCount: Array.isArray(existingBlocks) ? existingBlocks.length : 0,
        hasInlineImages: hasImages,
        proposedBlocksCount: proposedBlocksSplit.length,
        proposedBlockTypes: proposedBlocksSplit.map((b) =>
          b.type === "imageText" ? `${b.type} (${b.layout})` : b.type
        ),
      };
    });

    return NextResponse.json({ summary, preview }, { status: 200 });
  } catch (error: any) {
    console.error("Error generating blog migration preview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview blog migration" },
      { status: 500 }
    );
  }
}

// POST - Execute non-destructive migration of existing blogs into blocks
export async function POST(req: Request) {
  await ConnectDB();
  try {
    const body = await req.json().catch(() => ({}));
    const mode: "single-block" | "split-images" =
      body.mode === "single-block" ? "single-block" : "split-images";
    const blogId: string | undefined = body.blogId;
    const overwriteExistingBlocks: boolean = !!body.overwriteExistingBlocks;

    const query: any = blogId ? { _id: blogId } : {};
    const blogs = await BlogModel.find(query);

    let migratedCount = 0;
    let skippedCount = 0;
    const migratedBlogs: Array<{ _id: string; title: string; blocksCount: number }> = [];

    for (const blog of blogs) {
      const existingBlocks = blog.v2?.blocks || blog.blocks;
      const hasBlocks = Array.isArray(existingBlocks) && existingBlocks.length > 0;
      if (hasBlocks && !overwriteExistingBlocks) {
        skippedCount++;
        continue;
      }

      const newBlocks = convertHtmlToBlocks(
        blog.content || "",
        blog.v2?.blocks?.[0]?.arabicContent || blog.translations?.ar?.content,
        mode
      );

      // If blog has a tikTokVideoUrl, append an embed block
      if (blog.tikTokVideoUrl && !newBlocks.some((b) => b.type === "embed" && b.url === blog.tikTokVideoUrl)) {
        newBlocks.push({
          type: "embed",
          url: blog.tikTokVideoUrl,
          caption: "Watch on TikTok",
        });
      }

      const titleAR =
        blog.v2?.titleAR || blog.titleAR || blog.translations?.ar?.title || "";
      const excerptAR =
        blog.v2?.excerptAR || blog.excerptAR || blog.translations?.ar?.excerpt || "";

      const updateFields: Record<string, any> = {
        v2: {
          blocks: newBlocks,
          ...(titleAR ? { titleAR } : {}),
          ...(excerptAR ? { excerptAR } : {}),
        },
      };

      // Use direct collection update to ensure Mongoose schema cache never strips v2
      await BlogModel.collection.updateOne(
        { _id: blog._id },
        { $set: updateFields }
      );
      migratedCount++;
      migratedBlogs.push({
        _id: blog._id.toString(),
        title: blog.title,
        blocksCount: newBlocks.length,
      });
    }

    return NextResponse.json(
      {
        message: `Successfully migrated ${migratedCount} blog(s) (${skippedCount} skipped as they already had blocks). Legacy content field was preserved on all documents.`,
        mode,
        migratedCount,
        skippedCount,
        migratedBlogs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error migrating blogs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to migrate blogs" },
      { status: 500 }
    );
  }
}

