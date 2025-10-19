import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import videoModel from "@/app/modals/videoModel";
import UserModel from "@/app/modals/userModel";
import InteractionsModel from "@/app/modals/interactionsModel";
import { ConnectDB } from "@/app/config/db";
import mongoose from "mongoose";

// POST - Like/Unlike a video
export async function POST(
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

    // Check if user is subscribed
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // if (!user.isSubscribed) {
    //   return NextResponse.json(
    //     { error: "Subscription required to like videos" },
    //     { status: 403 }
    //   );
    // }

    const userId = user._id;

    // Find the video and populate user information for likes
    let video = await videoModel.findById(videoId).populate({
      path: "likes",
      model: "users",
      select: "username firstName lastName imageURL",
    });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Initialize likes array if it doesn't exist
    if (!video.likes) {
      video.likes = [];
    }

    // Check if user already liked the video
    console.log("userId:", userId, "type:", typeof userId);
    const alreadyLiked = video.likes.some((like: any) => {
      console.log("id in likes array:", like, "type:", typeof like);
      return like._id.toString() === userId.toString();
    });

    if (alreadyLiked) {
      // Unlike the video
      console.log("alreadyLiked" + alreadyLiked);
      video.likes = video.likes.filter(
        (like: any) => like._id.toString() !== userId.toString()
      );
    } else {
      // Like the video
      video.likes.push(new mongoose.Types.ObjectId(userId));
    }

    // Save the updated video with retry logic for version conflicts
    let retries = 3;
    let saved = false;

    while (retries > 0 && !saved) {
      try {
        await video.save();
        
        // Record the interaction for admin dashboard and notifications
        const { parentId, parentType } = await request.json();
        await InteractionsModel.create({
          userId: userId,
          targetId: videoId,
          targetType: "video",
          actionType: alreadyLiked ? "unlike" : "like",
          parentId: parentId || videoId,
          parentType: parentType || "video",
          read: false
        });
        
        saved = true;
      } catch (saveError: any) {
        if (saveError.name === "VersionError" && retries > 1) {
          console.log(
            `Version conflict detected, retrying... (${
              retries - 1
            } attempts left)`
          );
          // Refetch the latest version of the document
          const updatedVideo = await videoModel.findById(videoId);
          if (!updatedVideo) {
            throw new Error("Video not found during retry");
          }

          // Re-apply our changes to the fresh document
          if (alreadyLiked) {
            updatedVideo.likes = updatedVideo.likes.filter(
              (like: any) => like._id.toString() !== userId.toString()
            );
          } else {
            updatedVideo.likes.push(new mongoose.Types.ObjectId(userId));
          }

          video = updatedVideo;
          retries--;
        } else {
          // If it's not a version error or we're out of retries, rethrow
          throw saveError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: video.likes.length,
    });
  } catch (error: any) {
    console.error("Error handling video like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
