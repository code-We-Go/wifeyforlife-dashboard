import BlogModel from "@/app/models/blogModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET - Fetch a single blog by slug
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    const blog = await BlogModel.findOne({ slug })


    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: blog }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
}

// PATCH - Update view count
export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await req.json().catch(() => ({}));
    const { action, source } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    if (
      action === "increment_view" ||
      action === "increment_mobile_view" ||
      action === "increment_web_view"
    ) {
      const userAgent = req.headers.get("user-agent") || "";
      const platformHeader = (req.headers.get("x-platform") || "").toLowerCase();

      const isMobile =
        source === "mobile" ||
        action === "increment_mobile_view" ||
        platformHeader === "mobile" ||
        platformHeader === "ios" ||
        platformHeader === "android" ||
        (!source &&
          action === "increment_view" &&
          /mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent));

      const incField = isMobile ? "mobileViewCount" : "webViewCount";

      const blog = await BlogModel.findOneAndUpdate(
        { slug },
        {
          $inc: {
            viewCount: 1,
            [incField]: 1,
          },
        },
        { new: true }
      );

      if (!blog) {
        return NextResponse.json(
          { error: "Blog not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: blog }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}