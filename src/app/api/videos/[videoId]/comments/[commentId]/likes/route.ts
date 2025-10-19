import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import videoModel from "@/app/modals/videoModel";
import UserModel from "@/app/modals/userModel";
import InteractionsModel from "@/app/modals/interactionsModel";
import {ConnectDB} from "@/app/config/db";
import mongoose from "mongoose";

// POST - Like/Unlike a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string; commentId: string } }
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

    const { videoId, commentId } = params;
    
    // Check if user is subscribed
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    if (!user.isSubscribed) {
      return NextResponse.json(
        { error: "Subscription required to like comments" },
        { status: 403 }
      );
    }

    const userId = user._id.toString();
    
    // Find the video and check if the comment exists
    const video = await videoModel.findById(videoId);
    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
    
    // Find the comment in the video
    if (!video.comments) {
      return NextResponse.json(
        { error: "No comments found" },
        { status: 404 }
      );
    }
    
    const comment = video.comments.id ? video.comments.id(commentId) : 
                    video.comments.find((c: any) => c._id && c._id.toString() === commentId);
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }
    
    // Check if user already liked the comment
    const alreadyLiked = comment.likes && comment.likes.some((like: any) => 
      like._id ? like._id.toString() === userId : like.toString() === userId
    );
    
    if (alreadyLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter((like: any) => 
        like._id ? like._id.toString() !== userId : like.toString() !== userId
      );
    } else {
      // Like the comment
      if (!comment.likes) {
        comment.likes = [];
      }
      comment.likes.push(new mongoose.Types.ObjectId(userId));
    }
    
    // Save the updated video
    await video.save();
    
    // Record the interaction for admin dashboard and notifications
    const { parentId, parentType } = await request.json();
    await InteractionsModel.create({
      userId: userId,
      targetId: commentId,
      targetType: "comment",
      actionType: alreadyLiked ? "unlike" : "like",
      parentId: parentId || videoId,
      parentType: parentType || "video",
      read: false
    });
    
    return NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: comment.likes.length
    });
    
  } catch (error: any) {
    console.error("Error handling comment like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}