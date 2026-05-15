import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import WeddingTimelineModel from "@/app/models/WeddingTimeline";
import UserModel from "@/app/models/userModel";

async function loadDB() {
  await ConnectDB();
}

export async function GET() {
  try {
    await loadDB();

    // Fetch all timelines for stats calculation
    // Note: We only select necessary fields to keep it efficient
    const allTimelines = await WeddingTimelineModel.find({})
      .select("feedback userId exported")
      .lean();

    const totalTimelines = allTimelines.length;
    
    // Get unique user IDs to check subscription status
    const userIds = allTimelines.map((t: any) => t.userId).filter(Boolean);
    const uniqueUserIds = [...new Set(userIds.map((id: any) => id.toString()))];

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
    let totalExports = 0;
    let timelinesExportedCount = 0;

    allTimelines.forEach((t: any) => {
      // Check subscription
      if (t.userId && subMap.get(t.userId.toString())) {
        subscribedUsersCount++;
      }
      
      // Feedback stats
      if (t.feedback?.easeOfUse) {
        totalEase += t.feedback.easeOfUse;
        countEase++;
      }
      if (t.feedback?.satisfaction) {
        totalSat += t.feedback.satisfaction;
        countSat++;
      }

      // Export stats
      const exports = t.exported || 0;
      totalExports += exports;
      if (exports > 0) {
        timelinesExportedCount++;
      }
    });

    const stats = {
      total: totalTimelines,
      subscribedUsersCount,
      notSubscribedCount: totalTimelines - subscribedUsersCount,
      avgEaseOfUse: countEase > 0 ? parseFloat((totalEase / countEase).toFixed(2)) : 0,
      avgSatisfaction: countSat > 0 ? parseFloat((totalSat / countSat).toFixed(2)) : 0,
      totalExports,
      timelinesExportedCount,
      exportRate: totalTimelines > 0 ? parseFloat(((timelinesExportedCount / totalTimelines) * 100).toFixed(1)) : 0,
      subscriptionRate: totalTimelines > 0 ? parseFloat(((subscribedUsersCount / totalTimelines) * 100).toFixed(1)) : 0,
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("Error fetching wedding timeline stats:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
