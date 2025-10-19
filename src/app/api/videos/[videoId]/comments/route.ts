import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import videoModel from "@/app/modals/videoModel";
import UserModel from "@/app/modals/userModel";
import InteractionsModel from "@/app/modals/interactionsModel";
import { ConnectDB } from "@/app/config/db";
import { VideoComment } from "@/app/interfaces/interfaces";

// GET - Get all comments for a video
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    await ConnectDB();

    // Find the video with populated user data
    const video = await videoModel
      .findById(videoId)
      .populate({
        path: "comments.userId",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.likes",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.replies.userId",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .populate({
        path: "comments.replies.likes",
        model: "users",
        select: "username firstName lastName imageURL",
        options: { strictPopulate: false },
      })
      .lean();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Transform populated data to maintain API compatibility
    const videoData = video as any; // Type assertion to access comments
    const commentsWithUserDetails = (videoData.comments || []).map(
      (comment: any) => {
        const userData = comment.userId || {};
        
        // Process replies to add user details
        const repliesWithUserDetails = (comment.replies || []).map((reply: any) => {
          const replyUserData = reply.userId || {};
          return {
            ...reply,
            userImage: replyUserData.imageURL || "",
            firstName: replyUserData.firstName || "",
            lastName: replyUserData.lastName || "",
            // Keep userId as a string reference for backward compatibility
            userId: reply.userId?._id?.toString() || reply.userId,
          };
        });
        
        return {
          ...comment,
          userImage: userData.imageURL || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          // Keep userId as a string reference for backward compatibility
          userId: comment.userId?._id?.toString() || comment.userId,
          // Replace replies with the processed ones
          replies: repliesWithUserDetails,
        };
      }
    );

    return NextResponse.json({
      success: true,
      comments: commentsWithUserDetails || [],
    });
  } catch (error: any) {
    console.error("Error getting video comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add a comment to a video
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
    const { text, parentId, parentType } = await request.json();

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    // Check if user is subscribed
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is subscribed and subscription hasn't expired
    const today = new Date();
    if (
      !user.isSubscribed ||
      (user.expiryDate && new Date(user.expiryDate) < today)
    ) {
      return NextResponse.json(
        { error: "Active subscription required to comment on videos" },
        { status: 403 }
      );
    }

    // Find the video
    const video = await videoModel.findById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Create the comment
    const newComment = {
      userId: user._id.toString(),
      username: user.username,
      text: text.trim(),
      likes: [],
      replies: [],
      createdAt: new Date(),
    };

    // Add the comment to the video
    const updatedVideo = await videoModel.findByIdAndUpdate(
      videoId,
      { $push: { comments: newComment } },
      { new: true }
    );

    // Get the newly created comment with its ID
    const createdComment =
      updatedVideo.comments[updatedVideo.comments.length - 1];

    // Record the interaction for admin dashboard and notifications
    await InteractionsModel.create({
      userId: user._id,
      targetId: videoId,
      targetType: "video",
      actionType: "comment",
      content: text.trim(),
      read: false,
      parentId: parentId || videoId,
      parentType: parentType || "video",
    });

    // Prepare the comment with user data according to VideoComment interface
    const commentWithUserData = {
      ...createdComment.toObject(),
      _id: createdComment._id,
      userId: {
        _id: user._id.toString(),
        username: user.username,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        imageURL: user.imageURL || user.image || "",
      },
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userImage: user.imageURL || user.image || "",
    };

    return NextResponse.json({
      success: true,
      comment: commentWithUserData,
      commentsCount: updatedVideo.comments ? updatedVideo.comments.length : 0,
    });
  } catch (error: any) {
    console.error("Error adding video comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
