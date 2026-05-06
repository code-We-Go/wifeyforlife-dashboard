import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import { useParams } from "next/navigation";
import { LoyaltyTransactionModel } from "@/app/models/loyaltyTransactionModel";
import ordersModel from "@/app/models/ordersModel";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";
import playlistModel from "@/app/models/playlistModel";

export async function GET(request: NextRequest) {
  try {
    await ConnectDB();
    // Assuming the route is /api/users/[id]
    const { searchParams } = new URL(request.url);
    const userID = searchParams.get("userID");

    if (!userID) {
      return NextResponse.json(
        { error: "userID parameter is required" },
        { status: 400 },
      );
    }
    console.log("register ",subscriptionsModel,ordersModel,LoyaltyTransactionModel,packageModel,playlistModel)

    const user = await UserModel.findById(userID).populate({
      path: "subscriptions",
      select: "subscribed expiryDate allowedPlaylists miniSubscriptionActivated packageID",
      populate: [
        {
          path: "packageID",
          model: "packages",
          select: "name packagePlaylists accessAllPlaylists packageInspos accessAllInspos packagePartners accessAllPartners",
        },
        {
          path: "allowedPlaylists.playlistID",
          model: "playlists",
          select: "name",
        }
      ]
    });
    console.log("user:" + user);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
        const ordersCount = await ordersModel.countDocuments({ email: user.email });

    const loyaltyStats = await LoyaltyTransactionModel.aggregate([
      { $match: { email: user.email } },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: {
              $cond: [{ $eq: ["$type", "earn"] }, "$amount", 0],
            },
          },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$type", "spend"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const loyaltyPoints =
      loyaltyStats.length > 0
        ? (loyaltyStats[0].totalEarned || 0) - (loyaltyStats[0].totalSpent || 0)
        : 0;

    // 4. Construct Response
    const responseData: any = {
      name:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      imageURL: user.imageURL,
      numberOfOrders: ordersCount,
      loyaltyPoints: loyaltyPoints,
      weddingDate: user.weddingDate,
      birthDate: user.birthDate,
      isSubscribed: user.isSubscribed,
      subscriptions: user.subscriptions,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ConnectDB();

    const body = await request.json();
    const { userID, email, username, firstName, lastName, imageURL } = body;

    if (!userID) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { userID },
      { email, username, firstName, lastName, imageURL },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        imageURL: updatedUser.imageURL,
        emailVerified: updatedUser.emailVerified,
        isSubscribed: updatedUser.isSubscribed,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
