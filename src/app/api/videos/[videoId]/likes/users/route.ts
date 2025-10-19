import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import videoModel from "@/app/modals/videoModel";
import UserModel from "@/app/modals/userModel";
import { ConnectDB } from "@/app/config/db";

// GET - Get users who liked a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    await ConnectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { videoId } = await params;

    // Find the video
    const video = await videoModel.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Get the user IDs who liked the video
    const likeUserIds = video.likes || [];

    if (likeUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    // Find the users who liked the video
    const users = await UserModel.find(
      { _id: { $in: likeUserIds } },
      "username firstName lastName imageURL"
    );

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        _id: user._id,
        username: user.username,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        userImage: user.imageURL || "",
      })),
    });
  } catch (error: any) {
    console.error("Error getting users who liked video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}