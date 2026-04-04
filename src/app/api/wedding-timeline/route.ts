import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import WeddingTimelineModel from "@/app/models/WeddingTimeline";
import UserModel from "@/app/models/userModel";
import subscriptionsModel from "@/app/models/subscriptionsModel";

async function loadDB() {
  await ConnectDB();
}

// GET: List all wedding timelines with feedback and user data
export async function GET(request: Request) {
  try {
    await loadDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Only get timelines that have feedback
    const timelines = await WeddingTimelineModel.find({ 
      feedback: { $exists: true, $ne: null } 
    })
      .sort({ createdAt: -1 })
      .lean();

    // 1. Extract unique user IDs
    const userIds = [...new Set(timelines.map(t => t.userId).filter(Boolean))];

    // 2. Fetch users in bulk
    const users = await UserModel.find(
      { _id: { $in: userIds } },
      "firstName lastName email imageURL subscription"
    ).lean();

    // Create user map for fast lookup
    const userMap = new Map();
    const subscriptionIds = new Set();
    users.forEach((user: any) => {
      userMap.set(user._id.toString(), user);
      if (user.subscription) {
        subscriptionIds.add(user.subscription.toString());
      }
    });

    // 3. Fetch subscriptions in bulk
    const subscriptions = await subscriptionsModel.find(
      { _id: { $in: Array.from(subscriptionIds) } }
    ).lean();

    // Create subscription map for fast lookup
    const subscriptionMap = new Map();
    subscriptions.forEach((sub: any) => {
      subscriptionMap.set(sub._id.toString(), sub);
    });

    // 4. Populate user data for each timeline
    const timelinesWithUserData = timelines.map((timeline: any) => {
        let userData = null;
        let subscriptionData = null;

        if (timeline.userId) {
          const user = userMap.get(timeline.userId.toString());
          if (user) {
            userData = {
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              email: user.email || "",
              imageURL: user.imageURL || "",
            };

            if (user.subscription) {
              const subscription = subscriptionMap.get(user.subscription.toString());
              subscriptionData = {
                hasSubscription: subscription ? subscription.subscribed : false,
                expiryDate: subscription?.expiryDate || null,
              };
            } else {
              subscriptionData = {
                hasSubscription: false,
                expiryDate: null,
              };
            }
          }
        }

        return {
          ...timeline,
          user: userData,
          subscription: subscriptionData,
        };
    });

    // Filter by search term if provided
    let filteredTimelines = timelinesWithUserData;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTimelines = timelinesWithUserData.filter((timeline) => {
        const firstName = timeline.user?.firstName?.toLowerCase() || "";
        const lastName = timeline.user?.lastName?.toLowerCase() || "";
        const email = timeline.user?.email?.toLowerCase() || "";
        
        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          email.includes(searchLower)
        );
      });
    }

    // Apply pagination after filtering
    const total = filteredTimelines.length;
    const paginatedTimelines = filteredTimelines.slice(skip, skip + limit);

    // Calculate stats from all filtered timelines (not just current page)
    const subscribedUsersCount = filteredTimelines.filter(
      (t) => t.subscription?.hasSubscription
    ).length;

    const timelinesWithEaseOfUse = filteredTimelines.filter(
      (t) => (t as any).feedback?.easeOfUse && (t as any).feedback.easeOfUse > 0
    );
    const avgEaseOfUse = timelinesWithEaseOfUse.length > 0
      ? timelinesWithEaseOfUse.reduce((acc, t) => acc + ((t as any).feedback?.easeOfUse || 0), 0) / timelinesWithEaseOfUse.length
      : 0;

    const timelinesWithSatisfaction = filteredTimelines.filter(
      (t) => (t as any).feedback?.satisfaction && (t as any).feedback.satisfaction > 0
    );
    const avgSatisfaction = timelinesWithSatisfaction.length > 0
      ? timelinesWithSatisfaction.reduce((acc, t) => acc + ((t as any).feedback?.satisfaction || 0), 0) / timelinesWithSatisfaction.length
      : 0;

    return NextResponse.json({
      success: true,
      data: paginatedTimelines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        subscribedUsersCount,
        avgEaseOfUse: parseFloat(avgEaseOfUse.toFixed(2)),
        avgSatisfaction: parseFloat(avgSatisfaction.toFixed(2)),
      },
    });
  } catch (error: any) {
    console.error("Error fetching wedding timelines:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a wedding timeline feedback
export async function PUT(request: Request) {
  try {
    await loadDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Timeline ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { feedback } = body;

    if (!feedback) {
      return NextResponse.json(
        { success: false, message: "Feedback data is required" },
        { status: 400 }
      );
    }

    const updatedTimeline = await WeddingTimelineModel.findByIdAndUpdate(
      id,
      { feedback },
      { new: true, runValidators: true }
    );

    if (!updatedTimeline) {
      return NextResponse.json(
        { success: false, message: "Timeline not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timeline feedback updated successfully",
      data: updatedTimeline,
    });
  } catch (error: any) {
    console.error("Error updating wedding timeline:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a wedding timeline
export async function DELETE(request: Request) {
  try {
    await loadDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Timeline ID is required" },
        { status: 400 }
      );
    }

    const deletedTimeline = await WeddingTimelineModel.findByIdAndDelete(id);

    if (!deletedTimeline) {
      return NextResponse.json(
        { success: false, message: "Timeline not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timeline deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting wedding timeline:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
