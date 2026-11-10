import BlogModel from "@/app/models/blogModel";
import UserModel from "@/app/models/userModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - Fetch all blogs with pagination, search, and filtering
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const tag = searchParams.get("tag") || "";
    const featured = searchParams.get("featured");
    const all = searchParams.get("all") === "true";

    const limit = all ? 0 : 10;
    const skip = all ? 0 : (page - 1) * limit;

    // Build search query
    const searchQuery: any = {};

    // Text search in title, content, excerpt, and v2 blocks (English & Arabic)
    if (search) {
      searchQuery.$or = [
        { title: { $regex: search, $options: "i" } },
        { "v2.titleAR": { $regex: search, $options: "i" } },
        { titleAR: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { "v2.excerptAR": { $regex: search, $options: "i" } },
        { excerptAR: { $regex: search, $options: "i" } },
        { "v2.blocks.textHtml": { $regex: search, $options: "i" } },
        { "v2.blocks.arabicContent": { $regex: search, $options: "i" } },
        { "blocks.textHtml": { $regex: search, $options: "i" } },
        { "blocks.arabicContent": { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      searchQuery.status = status;
    }

    // Filter by category
    if (category) {
      searchQuery.categories = { $in: [category] };
    }

    // Filter by tag
    if (tag) {
      searchQuery.tags = { $in: [tag] };
    }

    // Filter by author


    // Filter by featured
    if (featured !== null && featured !== undefined) {
      searchQuery.featured = featured === "true";
    }

    // Get total count
    const totalBlogs = await BlogModel.countDocuments(searchQuery);

    // Get blogs with population
    const blogs = await BlogModel
      .find(searchQuery)

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        data: blogs,
        total: totalBlogs,
        currentPage: page,
        totalPages: all ? 1 : Math.ceil(totalBlogs / limit),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

// POST - Create a new blog
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const incomingBlocks = data.v2?.blocks || data.blocks;
    const hasBlocks = Array.isArray(incomingBlocks) && incomingBlocks.length > 0;
    const hasContent =
      typeof data.content === "string" && data.content.trim().length > 0;

    // Validate required fields (allow blocks OR content)
    if (!data.title || (!hasContent && !hasBlocks)) {
      return NextResponse.json(
        { error: "Title and content (or blocks) are required" },
        { status: 400 }
      );
    }

    // Auto-serialize blocks into content fallback if content is missing
    if (!hasContent && hasBlocks) {
      data.content =
        incomingBlocks
          .map((b: any) => (b.type === "image" ? "" : b.textHtml || ""))
          .filter((s: string) => s && s.trim().length > 0)
          .join("\n<hr/>\n") || "<p></p>";
    }

    const titleAR = data.v2?.titleAR ?? data.titleAR;
    const excerptAR = data.v2?.excerptAR ?? data.excerptAR;

    // Ensure v2 namespace is properly structured
    if (hasBlocks || titleAR || excerptAR) {
      data.v2 = {
        ...(data.v2 || {}),
        ...(hasBlocks ? { blocks: incomingBlocks } : {}),
        ...(titleAR ? { titleAR } : {}),
        ...(excerptAR ? { excerptAR } : {}),
      };
    }

    // Sync translations.ar with titleAR / excerptAR for backward compatibility
    if (titleAR || excerptAR) {
      data.translations = {
        ...(data.translations || {}),
        ar: {
          ...(data.translations?.ar || {}),
          ...(titleAR ? { title: titleAR } : {}),
          ...(excerptAR ? { excerpt: excerptAR } : {}),
        },
      };
    }

    // Check if author exists
    // const authorExists = await UserModel.findById(data.author);
    // if (!authorExists) {
    //   return NextResponse.json(
    //     { error: "Author not found" },
    //     { status: 404 }
    //   );
    // }

    // Generate slug if not provided
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    // Check if slug already exists
    const existingBlog = await BlogModel.findOne({ slug: data.slug });
    if (existingBlog) {
      // Append timestamp to make it unique
      data.slug = `${data.slug}-${Date.now()}`;
    }

    const newBlog = await BlogModel.create(data);

    // Populate author information
    // await newBlog.populate({
    //   path: "author",
    //   model: "users",
    //   select: "username firstName lastName email imageURL"
    // });

    return NextResponse.json({ data: newBlog }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a blog
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();

    const titleAR = data.v2?.titleAR ?? data.titleAR;
    const excerptAR = data.v2?.excerptAR ?? data.excerptAR;
    const incomingBlocks = data.v2?.blocks || data.blocks;

    if (incomingBlocks !== undefined || titleAR !== undefined || excerptAR !== undefined) {
      data.v2 = {
        ...(data.v2 || {}),
        ...(incomingBlocks !== undefined ? { blocks: incomingBlocks } : {}),
        ...(titleAR !== undefined ? { titleAR } : {}),
        ...(excerptAR !== undefined ? { excerptAR } : {}),
      };
    }

    // Sync translations.ar with titleAR / excerptAR if provided
    if (titleAR !== undefined || excerptAR !== undefined) {
      data.translations = {
        ...(data.translations || {}),
        ar: {
          ...(data.translations?.ar || {}),
          ...(titleAR !== undefined ? { title: titleAR } : {}),
          ...(excerptAR !== undefined ? { excerpt: excerptAR } : {}),
        },
      };
    }

    // If slug is being updated, check for uniqueness
    if (data.slug) {
      const existingBlog = await BlogModel.findOne({
        slug: data.slug,
        _id: { $ne: blogId }
      });
      if (existingBlog) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const updatedBlog = await BlogModel.findByIdAndUpdate(
      blogId,
      data,
      { new: true, runValidators: true, strict: false }
    );


    if (!updatedBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedBlog }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a blog
export async function DELETE(req: Request) {
  try {
    const data = await req.json();
    const { blogId } = data;

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const deletedBlog = await BlogModel.findByIdAndDelete(blogId);

    if (!deletedBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Blog deleted successfully", data: deletedBlog },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}