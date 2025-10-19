import { NextResponse } from "next/server";
import { ConnectDB } from "@/app/config/db";
import VideoModel from "@/app/modals/videoModel";
import InteractionsModel from "@/app/modals/interactionsModel";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ videoId: string; commentId: string }> }
) {
  try {
    // Connect to database
    await ConnectDB();

    // Get the current user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { videoId, commentId } = await params;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(videoId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json(
        { error: "Invalid video or comment ID" },
        { status: 400 }
      );
    }

    // Find the video and comment
    const video = await VideoModel.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Find the comment
    const comment = video.comments.find(
      (c: any) => c._id.toString() === commentId
    );

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if the user is the owner of the comment
    if (comment.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete the comment from the video
    await VideoModel.findByIdAndUpdate(videoId, {
      $pull: { comments: { _id: new mongoose.Types.ObjectId(commentId) } },
    });

    // Delete the interaction record
    await InteractionsModel.deleteMany({
      targetType: "video",
      actionType: "comment",
      targetId: videoId,
      userId: userId,
      "metadata.commentId": commentId,
    });

    // Also delete any interactions related to this comment (likes, replies)
    await InteractionsModel.deleteMany({
      targetType: "comment",
      targetId: commentId,
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}