import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import { NextResponse } from "next/server";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = {
      weddingDate: { $gte: today },
    };
console.log("registering subscription + packages"+subscriptionsModel +packageModel)
    const totalUsers = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .populate({
        path: "subscription",
        model: "subscriptions",
        populate: {
          path: "packageID",
          model: "packages", // Model name from subscriptionsModel ref
        },
        options: { strictPopulate: false },
      })
      .select("-password")
      .sort({ weddingDate: 1 }) // Ascending order
      .skip(skip)
      .limit(limit);

    return successResponse({
      users,
      pagination: {
        total: totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching upcoming wedding users:", error);
    return errorResponse("Failed to fetch users");
  }
}
