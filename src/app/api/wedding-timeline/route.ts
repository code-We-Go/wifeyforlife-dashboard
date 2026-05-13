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

    const feedbackOnly = searchParams.get("feedbackOnly") === "true";

    // 1. Build the base query
    const query: any = {};
    if (feedbackOnly) {
      query["feedback.easeOfUse"] = { $exists: true };
    }

    // 2. Handle search at database level
    if (search) {
      // Find users matching search criteria
      const matchingUsers = await UserModel.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      
      const userIds = matchingUsers.map((u: any) => u._id);
      query.userId = { $in: userIds };
    }

    const includeStats = searchParams.get("stats") === "true";
    const includeTotal = searchParams.get("total") === "true";

    // 3. Count total documents for pagination
    let total = 0;
    if (includeTotal) {
      total = await WeddingTimelineModel.countDocuments(query);
    }

    // 4. Fetch only the paginated data with full population
    const timelines = await WeddingTimelineModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'firstName lastName email imageURL subscriptions',
        populate: {
          path: 'subscriptions'
        }
      })
      .lean();

    // 5. Transform the paginated data for response
    const paginatedData = timelines.map((timeline: any) => {
      let userData = null;
      let subscriptionData = null;
      const user = timeline.userId;

      if (user) {
        userData = {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          imageURL: user.imageURL || "",
        };

        if (user.subscriptions && user.subscriptions.length > 0) {
          subscriptionData = {
            hasSubscription: user.subscriptions[0].subscribed || false,
            expiryDate: user.subscriptions[0].expiryDate || null,
          };
        } else {
          subscriptionData = {
            hasSubscription: false,
            expiryDate: null,
          };
        }
      }

      const { userId, ...rest } = timeline;
      return {
        ...rest,
        userId: user?._id?.toString() || (typeof userId === 'string' ? userId : null),
        user: userData,
        subscription: subscriptionData,
      };
    });

    // 6. Calculate stats efficiently without loading full documents
    let stats = null;
    if (includeStats) {
      const statsTimelines = await WeddingTimelineModel.find(query)
        .select("feedback userId")
        .lean();

      const userIdsForStats = statsTimelines.map((t: any) => t.userId).filter(Boolean);
      const uniqueUserIds = [...new Set(userIdsForStats.map((id: any) => id.toString()))];

      const usersWithSubs = await UserModel.find({ _id: { $in: uniqueUserIds } })
        .select("subscriptions")
        .populate("subscriptions", "subscribed")
        .lean();

      const subMap = new Map();
      usersWithSubs.forEach((u: any) => {
        subMap.set(u._id.toString(), u.subscriptions?.[0]?.subscribed || false);
      });

      let subscribedUsersCount = 0;
      let totalEase = 0, countEase = 0;
      let totalSat = 0, countSat = 0;

      statsTimelines.forEach((t: any) => {
        if (t.userId && subMap.get(t.userId.toString())) {
          subscribedUsersCount++;
        }
        if (t.feedback?.easeOfUse) {
          totalEase += t.feedback.easeOfUse;
          countEase++;
        }
        if (t.feedback?.satisfaction) {
          totalSat += t.feedback.satisfaction;
          countSat++;
        }
      });

      stats = {
        subscribedUsersCount,
        avgEaseOfUse: countEase > 0 ? parseFloat((totalEase / countEase).toFixed(2)) : 0,
        avgSatisfaction: countSat > 0 ? parseFloat((totalSat / countSat).toFixed(2)) : 0,
      };
    }

    const response: any = {
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
      },
    };

    if (includeTotal) {
      response.pagination.total = total;
      response.pagination.totalPages = Math.ceil(total / limit);
    }

    if (includeStats) {
      response.stats = stats;
    }

    return NextResponse.json(response);
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
