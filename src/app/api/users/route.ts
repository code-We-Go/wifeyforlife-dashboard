import { ConnectDB } from "@/config/db";
import UserModel from "@/app/models/userModel";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";

// Helper function for consistent error responses
const errorResponse = (message: string, status: number = 500) => {
  return NextResponse.json({ error: message }, { status });
};

// Helper function for consistent success responses
const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

// Ensure models are registered in Mongoose
const _registeredModels = [subscriptionsModel, packageModel];

export async function GET(req: Request) {
  try {
    await ConnectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const search = decodeURIComponent(searchParams.get("search") || "");
    const all = searchParams.get("all") === "true";
    const hasPushToken = searchParams.get("hasPushToken") === "true";

    if (userId) {
      const user = await UserModel.findById(userId)
        .populate({
          path: "subscriptions",
          populate: {
            path: "packageID",
            model: "packages",
          },
          options: { strictPopulate: false },
        })
        .select("-password")
        .lean();
      if (!user) return errorResponse("User not found", 404);
      return successResponse(user);
    }

    // Create search query
    const searchQuery: Record<string, unknown> = search
      ? {
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    if (hasPushToken) {
      searchQuery.pushToken = { $exists: true, $nin: [null, ""] };
    }

    // For selection dialogs (e.g. notifications), optimize query
    if (all) {
      const users = await UserModel.find(searchQuery)
        .populate({
          path: "subscriptions",
          select: "packageID subscribed status",
          populate: {
            path: "packageID",
            model: "packages",
            select: "name _id",
          },
          options: { strictPopulate: false },
        })
        .select("_id username email firstName lastName subscriptions pushToken")
        .sort({ createdAt: -1 })
        .lean();

      return successResponse({
        users,
        pagination: {
          total: users.length,
          currentPage: 1,
          totalPages: 1,
        },
      });
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count
    const totalUsers = await UserModel.countDocuments(searchQuery);

    // Get users with pagination
    const users = await UserModel.find(searchQuery)
      .populate({
        path: "subscriptions",
        populate: {
          path: "packageID",
          model: "packages",
        },
        options: { strictPopulate: false },
      })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse({
      users,
      pagination: {
        total: totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return errorResponse(error?.message || "Failed to fetch users");
  }
}

export async function POST(req: Request) {
  try {
    await ConnectDB();
    const data = await req.json();

    // Validate required fields
    if (!data.username || !data.password || !data.email) {
      return errorResponse("Username, email and password are required", 400);
    }

    // Normalize email to lowercase for consistent storage and comparisons
    data.email = String(data.email).trim().toLowerCase();

    // Check if user already exists with same username or email
    const existingUser = await UserModel.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        return errorResponse("Username already exists", 400);
      }
      if (existingUser.email === data.email) {
        return errorResponse("Email already exists", 400);
      }
    }

    const newUser = await UserModel.create(data);
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return successResponse(userWithoutPassword);
  } catch (error: any) {
    console.error("Error creating user:", error);
    return errorResponse(error.message);
  }
}

export async function PUT(request: Request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    const updateData = await request.json();

    // If email is being updated, normalize and check for uniqueness
    if (updateData.email) {
      updateData.email = String(updateData.email).trim().toLowerCase();
      const existingUser = await UserModel.findOne({
        email: updateData.email,
        _id: { $ne: userId }, // Exclude current user
      });

      if (existingUser) {
        return errorResponse("Email already exists", 400);
      }
    }

    // If password is being updated, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password"); // Exclude password from response

    if (!updatedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(updatedUser);
  } catch (error: any) {
    console.error("Error updating user:", error);
    return errorResponse(error.message);
  }
}

export async function DELETE(request: Request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    const deletedUser =
      await UserModel.findByIdAndDelete(userId).select("-password");

    if (!deletedUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse(deletedUser);
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return errorResponse(error.message);
  }
}
