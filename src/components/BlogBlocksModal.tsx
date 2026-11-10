"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { compressImage } from "@/utils/imageCompression";
import { UploadButton as UTUploadButton } from "@/utils/uploadthing";

type ModalType = "add" | "edit" | "delete" | "view";
type BlockLayout = "img-left" | "img-block";
type BlockType = "text" | "image" | "imageText" | "carousel" | "embed";

export interface BlockItem {
  id: string;
  type: BlockType;
  textHtml?: string;
  arabicContent?: string;
  imageUrl?: string;
  url?: string; // For embed (TikTok, Instagram, YouTube)
  caption?: string;
  alt?: string;
  layout?: BlockLayout; // img-left = image beside text, img-block = image above text
  images?: { imageUrl: string; alt?: string; caption?: string }[];
}

interface BlogBlocksModalProps {
  type: ModalType;
  blog?: any | null;
  closeModal: () => void;
  refreshData: () => void;
}

// Dynamically import ReactQuill (text-only toolbar, no images)
const ReactQuill: any = dynamic(
  async () => {
    const RQ = (await import("react-quill")).default as any;
    const Forwarded = React.forwardRef(function Forwarded(
      props: any,
      ref: any,
    ) {
      return <RQ ref={ref} {...props} />;
    });
    Forwarded.displayName = "ForwardedQuill";
    return Forwarded;
  },
  { ssr: false },
);
import "react-quill/dist/quill.snow.css";

const textEditorModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      [{ size: ["small", false, "large"] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link"],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  },
};

const textEditorFormats = [
  "header",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "indent",
  "align",
  "link",
  "blockquote",
  "code-block",
];

const MediaEmbedPreview: React.FC<{ url?: string; caption?: string }> = ({
  url,
  caption,
}) => {
  if (!url) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
        Enter a TikTok, Instagram, or YouTube link to preview media
      </div>
    );
  }

  const tiktokMatch =
    url.match(/(?:video|photo)\/(\d+)/) || url.match(/(\d{15,})/);
  const instagram = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  const youtube = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]+)/,
  );

  let embedSrc: string | null = null;
  let platform = "Media";
  let aspectRatio = "9/16";
  let maxWidth = "325px";
  let height = "580px";

  if (tiktokMatch) {
    embedSrc = `https://www.tiktok.com/player/v1/${tiktokMatch[1]}?embed_from=oembed&music_info=1&description=1&autoplay=0&muted=0`;
    platform = "TikTok";
  } else if (instagram) {
    embedSrc = `https://www.instagram.com/p/${instagram[1]}/embed`;
    platform = "Instagram";
    aspectRatio = "4/5";
    maxWidth = "360px";
    height = "480px";
  } else if (youtube) {
    embedSrc = `https://www.youtube.com/embed/${youtube[1]}`;
    platform = "YouTube";
    aspectRatio = "16/9";
    maxWidth = "560px";
    height = "315px";
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-gray-50 p-4">
      <span className="mb-2 inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary">
        {platform} Embed
      </span>
      {embedSrc ? (
        <div className="flex flex-col items-center w-full">
          <iframe
            src={embedSrc}
            width={platform === "YouTube" ? "100%" : "325"}
            height={height}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className="rounded-lg border shadow-sm bg-black"
            style={{ maxWidth, aspectRatio, height: "auto", minHeight: height }}
          />
          {caption && (
            <p className="mt-2 text-center text-xs text-gray-500">{caption}</p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-secondary hover:underline inline-flex items-center gap-1"
          >
            <span>Open in {platform}</span>
            <span>↗</span>
          </a>
        </div>
      ) : (
        <div className="text-center text-xs text-red-500">
          Could not parse valid embed URL for this platform
        </div>
      )}
    </div>
  );
};

const InlineCarousel: React.FC<{
  images: { imageUrl: string; alt?: string; caption?: string }[];
}> = ({ images }) => {
  const [index, setIndex] = useState(0);
  const count = images.length;
  if (!count) return null;
  const current = images[Math.max(0, Math.min(index, count - 1))];
  const prev = () => setIndex((p) => (p - 1 + count) % count);
  const next = () => setIndex((p) => (p + 1) % count);
  return (
    <div>
      <div className="relative">
        {current?.imageUrl && (
          <img
            src={current.imageUrl}
            alt={current.alt || ""}
            className="h-auto w-full rounded"
          />
        )}
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            Prev
          </button>
          <span className="text-xs text-gray-600">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            onClick={next}
            className="rounded bg-gray-100 px-3 py-1 text-sm"
          >
            Next
          </button>
        </div>
        {current?.caption && (
          <div className="mt-2 text-center text-sm text-gray-600">
            {current.caption}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Helper to split legacy HTML containing inline <img> tags into structured blocks.
 */
function parseLegacyHtmlIntoBlockItems(
  htmlContent: string,
  arabicContent?: string,
): BlockItem[] {
  const cleanHtml = (htmlContent || "").trim();
  if (!cleanHtml) return [];

  const imgRegex = /<img\b[^>]*>/gi;
  if (!imgRegex.test(cleanHtml)) {
    return [
      {
        id: `0-${Date.now()}`,
        type: "text",
        textHtml: cleanHtml,
        arabicContent: arabicContent || "",
      },
    ];
  }

  const segments: Array<{
    type: "html" | "img";
    value: string;
    src?: string;
    alt?: string;
  }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = /<img\b[^>]*>/gi;

  while ((match = regex.exec(cleanHtml)) !== null) {
    const before = cleanHtml.slice(lastIndex, match.index).trim();
    if (before) segments.push({ type: "html", value: before });
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
  if (remaining) segments.push({ type: "html", value: remaining });

  const isMeaningfulHtml = (html: string) =>
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0;

  const result: BlockItem[] = [];
  let i = 0;
  while (i < segments.length) {
    const current = segments[i];
    const id = `block-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (current.type === "html") {
      if (isMeaningfulHtml(current.value)) {
        result.push({ id, type: "text", textHtml: current.value });
      }
      i++;
    } else if (current.type === "img" && current.src) {
      const next = segments[i + 1];
      if (next && next.type === "html" && isMeaningfulHtml(next.value)) {
        result.push({
          id,
          type: "imageText",
          layout: "img-left",
          imageUrl: current.src,
          alt: current.alt || "",
          textHtml: next.value,
        });
        i += 2;
      } else {
        result.push({
          id,
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

  if (arabicContent && result.length > 0) {
    const firstText = result.find(
      (b) => b.type === "text" || b.type === "imageText",
    );
    if (firstText) firstText.arabicContent = arabicContent;
  }

  return result;
}

const BlogBlocksModal: React.FC<BlogBlocksModalProps> = ({
  type,
  blog,
  closeModal,
  refreshData,
}) => {
  const isEdit = type === "edit";
  const isDelete = type === "delete";
  const isView = type === "view";

  const [title, setTitle] = useState("");
  const [titleAR, setTitleAR] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [featured, setFeatured] = useState(false);
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(
    undefined,
  );
  const [tikTokVideoUrl, setTikTokVideoUrl] = useState<string | undefined>(
    undefined,
  );
  const [excerpt, setExcerpt] = useState("");
  const [excerptAR, setExcerptAR] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [categoriesInput, setCategoriesInput] = useState("");
  const [metaTitle, setMetaTitle] = useState<string | undefined>(undefined);
  const [metaDescription, setMetaDescription] = useState<string | undefined>(
    undefined,
  );
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  useEffect(() => {
    if (blog && (isEdit || isView)) {
      setTitle(blog.title || "");
      setTitleAR(
        blog.v2?.titleAR || blog.titleAR || blog.translations?.ar?.title || ""
      );
      setSlug(blog.slug || "");
      setStatus((blog.status as any) || "draft");
      setFeatured(!!blog.featured);
      setFeaturedImage(blog.featuredImage);
      setTikTokVideoUrl(blog.tikTokVideoUrl);
      setExcerpt(blog.excerpt || "");
      setExcerptAR(
        blog.v2?.excerptAR ||
          blog.excerptAR ||
          blog.translations?.ar?.excerpt ||
          ""
      );
      setTagsInput((Array.isArray(blog.tags) ? blog.tags : []).join(", "));
      setCategoriesInput(
        (Array.isArray(blog.categories) ? blog.categories : []).join(", "),
      );
      setMetaTitle(blog.metaTitle);
      setMetaDescription(blog.metaDescription);

      const existingBlocks = blog.v2?.blocks || blog.blocks;
      const incomingBlocks: BlockItem[] =
        Array.isArray(existingBlocks) && existingBlocks.length > 0
          ? existingBlocks.map((b: any, idx: number) => ({
              id: `${idx}-${Date.now()}`,
              ...b,
            }))
          : blog.content
            ? [
                {
                  id: `0-${Date.now()}`,
                  type: "text",
                  textHtml: blog.content,
                  arabicContent: blog.translations?.ar?.content || "",
                },
              ]
            : [];
      setBlocks(incomingBlocks);
    }
  }, [blog, isEdit, isView]);

  const toArray = (value: string) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const addBlock = (blockType: BlockType, layout?: BlockLayout) => {
    const id = `${blockType}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setBlocks((prev) => [
      ...prev,
      {
        id,
        type: blockType,
        layout: layout ?? (blockType === "imageText" ? "img-block" : undefined),
        textHtml: blockType === "text" ? "<p></p>" : undefined,
        images: blockType === "carousel" ? [] : undefined,
        url: blockType === "embed" ? "" : undefined,
      },
    ]);
  };

  const updateBlock = (id: string, updates: Partial<BlockItem>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    );
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newArr = [...prev];
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= newArr.length) return prev;
      const temp = newArr[idx];
      newArr[idx] = newArr[swapWith];
      newArr[swapWith] = temp;
      return newArr;
    });
  };

  const handleSplitLegacyHtmlIntoBlocks = () => {
    if (!blog?.content) return;
    const split = parseLegacyHtmlIntoBlockItems(
      blog.content,
      blog.translations?.ar?.content,
    );
    if (split.length > 0) {
      setBlocks(split);
    }
  };

  const uploadImage = async (): Promise<string | undefined> => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      return new Promise((resolve) => {
        let isResolved = false;
        const done = (url?: string) => {
          if (!isResolved) {
            isResolved = true;
            resolve(url);
          }
        };

        input.onchange = async () => {
          try {
            const file = input.files?.[0];
            if (!file) return done(undefined);
            const processed = await compressImage(file);
            const { uploadFiles } = genUploader<OurFileRouter>();
            const res: any[] = await uploadFiles("mediaUploader", {
              files: [processed],
            });
            const url = res?.[0]?.url || res?.[0]?.fileUrl || undefined;
            done(url);
          } catch (err) {
            console.error("Image upload failed", err);
            done(undefined);
          }
        };

        input.oncancel = () => {
          done(undefined);
        };

        const handleFocus = () => {
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              done(undefined);
            }
            window.removeEventListener("focus", handleFocus);
          }, 500);
        };
        window.addEventListener("focus", handleFocus);

        input.click();
      });
    } catch (err) {
      console.error("Image upload failed", err);
      return undefined;
    }
  };

  const uploadImagesBulk = async (): Promise<string[] | undefined> => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      return new Promise((resolve) => {
        let isResolved = false;
        const done = (urls?: string[]) => {
          if (!isResolved) {
            isResolved = true;
            resolve(urls);
          }
        };

        input.onchange = async () => {
          try {
            const files = Array.from(input.files || []);
            if (!files.length) return done(undefined);
            const processed = await Promise.all(
              files.map((f) => compressImage(f)),
            );
            const { uploadFiles } = genUploader<OurFileRouter>();
            const res: any[] = await uploadFiles("mediaUploader", {
              files: processed,
            });
            const urls = res
              .map((r) => r?.url || r?.fileUrl)
              .filter((u: any) => typeof u === "string");
            done(urls);
          } catch (err) {
            console.error("Image upload failed", err);
            done(undefined);
          }
        };

        input.oncancel = () => {
          done(undefined);
        };

        const handleFocus = () => {
          setTimeout(() => {
            if (!input.files || input.files.length === 0) {
              done(undefined);
            }
            window.removeEventListener("focus", handleFocus);
          }, 500);
        };
        window.addEventListener("focus", handleFocus);

        input.click();
      });
    } catch (err) {
      console.error("Image upload failed", err);
      return undefined;
    }
  };

  const handleSave = async () => {
    if (isDelete) return;
    setSaving(true);
    try {
      // Serialize blocks' text into a content HTML fallback for compatibility with legacy pages & mobile app
      const contentHtml = blocks
        .map((b) => {
          if (b.type === "image") {
            return b.imageUrl ? `<img src="${b.imageUrl}" alt="${b.alt || ""}" />` : "";
          }
          if (b.type === "imageText") {
            const imgPart = b.imageUrl
              ? `<img src="${b.imageUrl}" alt="${b.alt || ""}" />`
              : "";
            return `${imgPart}\n${b.textHtml || ""}`;
          }
          return b.textHtml || "";
        })
        .filter((s) => s && s.trim().length)
        .join("\n<hr/>\n");

      const payload: any = {
        title,
        slug: slug || generateSlug(title),
        status,
        featured,
        featuredImage,
        tikTokVideoUrl,
        excerpt,
        tags: toArray(tagsInput),
        categories: toArray(categoriesInput),
        metaTitle,
        metaDescription,
        content: contentHtml || blog?.content || "<p></p>",
        // Completely separate V2 object
        v2: {
          titleAR,
          excerptAR,
          blocks: blocks.map(({ id, ...rest }) => rest),
        },
      };

      if (isEdit && blog?._id) {
        await axios.put(`/api/blogs?id=${blog._id}`, payload);
      } else {
        await axios.post(`/api/blogs`, payload);
      }

      refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Failed to save blog", error);
      alert(error?.response?.data?.error || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!blog?._id) return;
    setSaving(true);
    try {
      await axios.delete(`/api/blogs`, { data: { blogId: blog._id } });
      refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Failed to delete blog", error);
      alert(error?.response?.data?.error || "Failed to delete blog");
    } finally {
      setSaving(false);
    }
  };

  const Header = (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">
        {isDelete
          ? "Delete Blog"
          : isEdit
            ? "Edit Blog (Blocks Builder)"
            : isView
              ? "View Blog (Blocks Preview)"
              : "Add New Blog (Blocks Builder)"}
      </h2>
      <button
        onClick={closeModal}
        className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
      >
        Close
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 md:pl-72.5">
      <div className="max-h-[90vh] w-[95%] max-w-5xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
        {Header}

        {/* Wifey Views Stats Banner on Edit/View */}
        {(isEdit || isView) && blog && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <span className="font-semibold text-gray-700">Views:</span>
            <span className="text-gray-600">
              Total:{" "}
              <strong className="text-gray-900">{blog.viewCount ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
              🌐 Web: {blog.webViewCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
              📱 Mobile: {blog.mobileViewCount ?? 0}
            </span>
            <span className="ml-auto text-xs text-gray-500">
              Blocks: <strong>{blocks.length}</strong>
            </span>
          </div>
        )}

        {isDelete ? (
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{blog?.title}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : isView ? (
          <div className="space-y-4">
            {featuredImage && (
              <img
                src={featuredImage}
                alt="Featured"
                className="max-h-80 w-full rounded object-cover"
              />
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-xs font-semibold uppercase text-gray-400">
                  English Title
                </span>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {excerpt && (
                  <p className="mt-1 text-sm text-gray-600">{excerpt}</p>
                )}
              </div>
              {titleAR && (
                <div dir="rtl">
                  <span className="text-xs font-semibold uppercase text-gray-400">
                    العنوان بالعربية
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{titleAR}</h3>
                  {excerptAR && (
                    <p className="mt-1 text-sm text-gray-600">{excerptAR}</p>
                  )}
                </div>
              )}
            </div>

            {/* Render blocks */}
            <div className="space-y-6">
              {blocks.map((b) => (
                <div key={b.id} className="rounded border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase text-gray-400">
                    {b.type}{" "}
                    {b.type === "imageText" ? `(${b.layout || "img-block"})` : ""}
                  </div>
                  {b.type === "text" && (
                    <div className="space-y-3">
                      <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: b.textHtml || "" }}
                      />
                      {b.arabicContent && (
                        <div
                          dir="rtl"
                          className="prose max-w-none border-t pt-3"
                          dangerouslySetInnerHTML={{
                            __html: b.arabicContent || "",
                          }}
                        />
                      )}
                    </div>
                  )}
                  {b.type === "image" && (
                    <figure className="flex flex-col items-center">
                      {b.imageUrl && (
                        <img
                          src={b.imageUrl}
                          alt={b.alt || ""}
                          className="mx-auto h-auto max-h-[75vh] w-auto max-w-full rounded object-contain"
                        />
                      )}
                      {b.caption && (
                        <figcaption className="mt-2 text-center text-sm text-gray-600">
                          {b.caption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                  {b.type === "imageText" && (
                    <div
                      className={
                        b.layout === "img-left"
                          ? "grid grid-cols-1 gap-4 md:grid-cols-2 items-start"
                          : "space-y-3"
                      }
                    >
                      <div className="flex flex-col items-center">
                        {b.imageUrl && (
                          <img
                            src={b.imageUrl}
                            alt={b.alt || ""}
                            className="h-auto max-h-[70vh] w-auto max-w-full rounded object-contain"
                          />
                        )}
                        {b.caption && (
                          <div className="mt-2 text-center text-sm text-gray-600">
                            {b.caption}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: b.textHtml || "" }}
                        />
                        {b.arabicContent && (
                          <div
                            dir="rtl"
                            className="prose max-w-none border-t pt-3"
                            dangerouslySetInnerHTML={{
                              __html: b.arabicContent || "",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {b.type === "carousel" && (
                    <InlineCarousel images={b.images || []} />
                  )}
                  {b.type === "embed" && (
                    <MediaEmbedPreview url={b.url} caption={b.caption} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {/* Basics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="English blog title"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Title (Arabic)
                </label>
                <input
                  dir="rtl"
                  value={titleAR}
                  onChange={(e) => setTitleAR(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="العنوان بالعربية"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Auto-generated from title if empty"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700">
                    Featured Blog
                  </label>
                </div>
              </div>
            </div>

            {/* Featured image & TikTok */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Featured Image
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={featuredImage || ""}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="Image URL"
                  />
                  <UTUploadButton
                    appearance={{
                      button:
                        "bg-primary text-creamey rounded-md px-4 py-2 text-sm font-bold hover:bg-primary/80 transition hover:cursor-pointer min-w-[120px]",
                    }}
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      const url = res?.[0]?.url as string | undefined;
                      if (url) setFeaturedImage(url);
                    }}
                    onUploadError={(err) => {
                      console.error("Upload error:", err);
                      alert(`Upload failed: ${err.message}`);
                    }}
                    onBeforeUploadBegin={async (files) => {
                      const processed = await Promise.all(
                        files.map((file) =>
                          file.type.startsWith("image/")
                            ? compressImage(file)
                            : file,
                        ),
                      );
                      return processed;
                    }}
                  />
                </div>
                {featuredImage && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="h-24 w-auto rounded border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage("")}
                      className="text-xs text-red-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  TikTok Video URL (Optional)
                </label>
                <input
                  value={tikTokVideoUrl || ""}
                  onChange={(e) => setTikTokVideoUrl(e.target.value)}
                  className="w-full rounded border px-3 py-2 text-sm"
                  placeholder="https://www.tiktok.com/@username/video/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Add a TikTok video URL to embed in the blog post
                </p>
              </div>
            </div>

            {/* Excerpt & Excerpt (Arabic) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Excerpt
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                  placeholder="Short summary (optional)"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Excerpt (Arabic)
                </label>
                <textarea
                  dir="rtl"
                  value={excerptAR}
                  onChange={(e) => setExcerptAR(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                  placeholder="ملخص قصير بالعربية (اختياري)"
                />
              </div>
            </div>

            {/* Tags & Categories (Plain strings, comma separated) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Tags (comma separated)
                </label>
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="wedding, bridal, dresses"
                />
                {toArray(tagsInput).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {toArray(tagsInput).map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">
                  Categories (comma separated)
                </label>
                <input
                  value={categoriesInput}
                  onChange={(e) => setCategoriesInput(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Planning, Fashion, Beauty"
                />
                {toArray(categoriesInput).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {toArray(categoriesInput).map((cat, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs text-purple-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Blocks Builder */}
            <div className="rounded border p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => addBlock("text")}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    + Text Block
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("imageText", "img-left")}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    + Image beside text
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("imageText", "img-block")}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    + Image above text
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("image", "img-block")}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    + Image only
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("carousel")}
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    + Carousel
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock("embed")}
                    className="rounded border border-secondary/40 bg-secondary/5 px-3 py-1 text-sm font-medium text-secondary hover:bg-secondary/15"
                  >
                    + Embed (TikTok / Instagram / YouTube)
                  </button>
                </div>

                {/* Helper button if editing a legacy blog with inline <img> tags */}
                {blog?.content && /<img\b[^>]*>/i.test(blog.content) && (
                  <button
                    type="button"
                    onClick={handleSplitLegacyHtmlIntoBlocks}
                    className="rounded bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
                    title="Extracts inline <img> tags from legacy HTML content into structured Image + Text blocks"
                  >
                    ✨ Split Legacy HTML Images into Blocks
                  </button>
                )}
              </div>

              {blocks.length === 0 ? (
                <p className="text-sm text-gray-600">No blocks added yet.</p>
              ) : (
                <div className="space-y-4">
                  {blocks.map((b, blockIdx) => (
                    <div key={b.id} className="rounded border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          #{blockIdx + 1} —{" "}
                          {b.type === "text" && "Text Block"}
                          {b.type === "image" && "Image Block"}
                          {b.type === "carousel" && "Carousel Block"}
                          {b.type === "embed" && "Media Embed (TikTok / Instagram / YouTube)"}
                          {b.type === "imageText" &&
                            (b.layout === "img-left"
                              ? "Image beside text"
                              : "Image above text")}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => moveBlock(b.id, "up")}
                            className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(b.id, "down")}
                            className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(b.id)}
                            className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {b.type !== "text" && b.type !== "carousel" && (
                        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-sm text-gray-700">
                              Image URL
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                value={b.imageUrl || ""}
                                onChange={(e) =>
                                  updateBlock(b.id, {
                                    imageUrl: e.target.value,
                                  })
                                }
                                className="w-full rounded border px-3 py-2"
                                placeholder="https://..."
                              />
                              <button
                                type="button"
                                disabled={uploadingBlockId === b.id}
                                onClick={async () => {
                                  setUploadingBlockId(b.id);
                                  try {
                                    const url = await uploadImage();
                                    if (url)
                                      updateBlock(b.id, { imageUrl: url });
                                  } finally {
                                    setUploadingBlockId(null);
                                  }
                                }}
                                className="rounded bg-secondary px-3 py-2 text-white disabled:opacity-50"
                              >
                                {uploadingBlockId === b.id
                                  ? "Uploading..."
                                  : "Upload"}
                              </button>
                            </div>
                            {b.imageUrl && (
                              <img
                                src={b.imageUrl}
                                alt={b.alt || ""}
                                className="mt-2 h-24 w-auto rounded object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-sm text-gray-700">
                              Alt text
                            </label>
                            <input
                              value={b.alt || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { alt: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2"
                            />
                            <label className="mb-1 mt-2 block text-sm text-gray-700">
                              Caption
                            </label>
                            <input
                              value={b.caption || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { caption: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2"
                            />
                            {b.type === "imageText" && (
                              <div className="mt-2">
                                <label className="mb-1 block text-sm text-gray-700">
                                  Layout
                                </label>
                                <select
                                  value={b.layout || "img-block"}
                                  onChange={(e) =>
                                    updateBlock(b.id, {
                                      layout: e.target.value as BlockLayout,
                                    })
                                  }
                                  className="w-full rounded border px-3 py-2"
                                >
                                  <option value="img-left">
                                    Image beside text
                                  </option>
                                  <option value="img-block">
                                    Image above text
                                  </option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(b.type === "text" || b.type === "imageText") && (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Text (English)
                          </label>
                          <ReactQuill
                            theme="snow"
                            value={b.textHtml || ""}
                            onChange={(val: string) =>
                              updateBlock(b.id, { textHtml: val })
                            }
                            modules={textEditorModules}
                            formats={textEditorFormats}
                            placeholder={"Write block text here..."}
                          />
                          <label className="mb-2 mt-4 block text-sm font-medium text-gray-700">
                            Arabic Content (المحتوى بالعربية)
                          </label>
                          <ReactQuill
                            dir="rtl"
                            theme="snow"
                            value={b.arabicContent || ""}
                            onChange={(val: string) =>
                              updateBlock(b.id, { arabicContent: val })
                            }
                            modules={textEditorModules}
                            formats={textEditorFormats}
                            placeholder={"اكتب المحتوى العربي هنا..."}
                          />
                        </div>
                      )}

                      {b.type === "carousel" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              Carousel Images
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlock(b.id, {
                                    images: [
                                      ...(b.images || []),
                                      { imageUrl: "", alt: "", caption: "" },
                                    ],
                                  })
                                }
                                className="rounded bg-gray-100 px-2 py-1 text-xs"
                              >
                                + Add Image URL
                              </button>
                              <button
                                type="button"
                                disabled={uploadingBlockId === `${b.id}:bulk`}
                                onClick={async () => {
                                  setUploadingBlockId(`${b.id}:bulk`);
                                  try {
                                    const urls = await uploadImagesBulk();
                                    if (urls && urls.length) {
                                      const next = [
                                        ...(b.images || []),
                                        ...urls.map((u) => ({
                                          imageUrl: u,
                                          alt: "",
                                          caption: "",
                                        })),
                                      ];
                                      updateBlock(b.id, { images: next });
                                    }
                                  } finally {
                                    setUploadingBlockId(null);
                                  }
                                }}
                                className="rounded bg-secondary px-2 py-1 text-xs text-white disabled:opacity-50"
                              >
                                {uploadingBlockId === `${b.id}:bulk`
                                  ? "Uploading..."
                                  : "Upload Multiple Images"}
                              </button>
                            </div>
                          </div>
                          {(b.images || []).length === 0 ? (
                            <p className="text-sm text-gray-600">
                              No images added.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {(b.images || []).map((img, i) => (
                                <div
                                  key={i}
                                  className="grid grid-cols-1 gap-3 rounded border bg-gray-50 p-2 md:grid-cols-2"
                                >
                                  <div>
                                    <label className="mb-1 block text-sm text-gray-700">
                                      Image URL
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        value={img.imageUrl || ""}
                                        onChange={(e) => {
                                          const arr = [...(b.images || [])];
                                          arr[i] = {
                                            ...arr[i],
                                            imageUrl: e.target.value,
                                          };
                                          updateBlock(b.id, { images: arr });
                                        }}
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="https://..."
                                      />
                                      <button
                                        type="button"
                                        disabled={
                                          uploadingBlockId === `${b.id}:${i}`
                                        }
                                        onClick={async () => {
                                          setUploadingBlockId(`${b.id}:${i}`);
                                          try {
                                            const url = await uploadImage();
                                            if (url) {
                                              const arr = [...(b.images || [])];
                                              arr[i] = {
                                                ...arr[i],
                                                imageUrl: url,
                                              };
                                              updateBlock(b.id, {
                                                images: arr,
                                              });
                                            }
                                          } finally {
                                            setUploadingBlockId(null);
                                          }
                                        }}
                                        className="rounded bg-secondary px-3 py-2 text-white disabled:opacity-50"
                                      >
                                        {uploadingBlockId === `${b.id}:${i}`
                                          ? "Uploading..."
                                          : "Upload"}
                                      </button>
                                    </div>
                                    {img.imageUrl && (
                                      <img
                                        src={img.imageUrl}
                                        alt={img.alt || ""}
                                        className="mt-2 h-24 w-auto rounded"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm text-gray-700">
                                      Alt text
                                    </label>
                                    <input
                                      value={img.alt || ""}
                                      onChange={(e) => {
                                        const arr = [...(b.images || [])];
                                        arr[i] = {
                                          ...arr[i],
                                          alt: e.target.value,
                                        };
                                        updateBlock(b.id, { images: arr });
                                      }}
                                      className="w-full rounded border px-3 py-2"
                                    />
                                    <label className="mb-1 mt-2 block text-sm text-gray-700">
                                      Caption
                                    </label>
                                    <input
                                      value={img.caption || ""}
                                      onChange={(e) => {
                                        const arr = [...(b.images || [])];
                                        arr[i] = {
                                          ...arr[i],
                                          caption: e.target.value,
                                        };
                                        updateBlock(b.id, { images: arr });
                                      }}
                                      className="w-full rounded border px-3 py-2"
                                    />
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const arr = [...(b.images || [])];
                                          const tmp = arr[i - 1];
                                          if (typeof tmp !== "undefined") {
                                            arr[i - 1] = arr[i];
                                            arr[i] = tmp;
                                            updateBlock(b.id, { images: arr });
                                          }
                                        }}
                                        className="rounded bg-gray-100 px-2 py-1 text-xs"
                                      >
                                        Move Up
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const arr = [...(b.images || [])];
                                          const tmp = arr[i + 1];
                                          if (typeof tmp !== "undefined") {
                                            arr[i + 1] = arr[i];
                                            arr[i] = tmp;
                                            updateBlock(b.id, { images: arr });
                                          }
                                        }}
                                        className="rounded bg-gray-100 px-2 py-1 text-xs"
                                      >
                                        Move Down
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const arr = [...(b.images || [])];
                                          arr.splice(i, 1);
                                          updateBlock(b.id, { images: arr });
                                        }}
                                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                                      >
                                        Remove Image
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {b.type === "embed" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Media Link (TikTok, Instagram, or YouTube)
                            </label>
                            <input
                              value={b.url || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { url: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2 text-sm"
                              placeholder="https://www.tiktok.com/@user/video/... or https://www.instagram.com/reel/... or https://youtu.be/..."
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Caption (Optional)
                            </label>
                            <input
                              value={b.caption || ""}
                              onChange={(e) =>
                                updateBlock(b.id, { caption: e.target.value })
                              }
                              className="w-full rounded border px-3 py-2 text-sm"
                              placeholder="Caption for this video or post"
                            />
                          </div>
                          <div className="pt-1">
                            <MediaEmbedPreview url={b.url} caption={b.caption} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded bg-secondary px-4 py-2 text-white disabled:opacity-50"
              >
                {saving
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Blog"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BlogBlocksModal;

