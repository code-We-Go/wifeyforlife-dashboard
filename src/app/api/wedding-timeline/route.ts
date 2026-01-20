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

    // Populate user data for each timeline
    const timelinesWithUserData = await Promise.all(
      timelines.map(async (timeline) => {
        let userData = null;
        let subscriptionData = null;

        if (timeline.userId) {
          const user = await UserModel.findById(timeline.userId)
            .select("firstName lastName email imageURL subscription")
            .lean();

          if (user) {
            userData = {
              firstName: (user as any).firstName || "",
              lastName: (user as any).lastName || "",
              email: (user as any).email || "",
              imageURL: (user as any).imageURL || "",
            };

            // Check if user has an active subscription
            if ((user as any).subscription) {
              const subscription = await subscriptionsModel.findById((user as any).subscription).lean();
              subscriptionData = {
                hasSubscription: subscription ? (subscription as any).subscribed : false,
                expiryDate: (subscription as any)?.expiryDate || null,
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
      })
    );

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

    return NextResponse.json({
      success: true,
      data: paginatedTimelines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
