import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import ShoppingBrandModel from "@/app/models/shoppingBestieModel";
import UserModel from "@/app/models/userModel";

const loadDB = async () => {
  await ConnectDB();
};
// GET: List all brands with optional filtering & analytics summary
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const subCategory = searchParams.get("subCategory");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");
  const analytics = searchParams.get("analytics");

  await loadDB();
console.log(UserModel + "registeration")

  try {
    // Analytics mode: return aggregated stats
    if (analytics === "true") {
      const totalBrands = await ShoppingBrandModel.countDocuments({});
      const activeBrands = await ShoppingBrandModel.countDocuments({ isActive: true });
      const totalClicks = await ShoppingBrandModel.aggregate([
        { $group: { _id: null, total: { $sum: "$clicks" } } },
      ]);
      // Single pass: true avg across every individual review + total count
      const reviewStats = await ShoppingBrandModel.aggregate([
        { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, avg: { $avg: "$reviews.rating" }, total: { $sum: 1 } } },
      ]);
      const topByClicks = await ShoppingBrandModel.aggregate([
        { $sort: { clicks: -1 } },
        { $limit: 5 },
        {
          $addFields: {
            averageRating: {
              $cond: [
                { $gt: [{ $size: "$reviews" }, 0] },
                { $avg: { $map: { input: "$reviews", as: "r", in: "$$r.rating" } } },
                0,
              ],
            },
            totalRatings: { $size: "$reviews" },
          },
        },
        { $project: { name: 1, clicks: 1, averageRating: 1, totalRatings: 1, logo: 1, category: 1 } },
      ]);
      const topByRating = await ShoppingBrandModel.aggregate([
        { $match: { "reviews.0": { $exists: true } } },
        {
          $addFields: {
            averageRating: { $avg: { $map: { input: "$reviews", as: "r", in: "$$r.rating" } } },
            totalRatings: { $size: "$reviews" },
          },
        },
        { $sort: { averageRating: -1 } },
        { $limit: 5 },
        { $project: { name: 1, clicks: 1, averageRating: 1, totalRatings: 1, logo: 1, category: 1 } },
      ]);
      const categoryStats = await ShoppingBrandModel.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, totalClicks: { $sum: "$clicks" } } },
        { $sort: { totalClicks: -1 } },
      ]);

      return NextResponse.json({
        data: {
          totalBrands,
          activeBrands,
          totalClicks: totalClicks[0]?.total ?? 0,
          avgRating: reviewStats[0]?.avg ?? 0,
          totalReviews: reviewStats[0]?.total ?? 0,
          topByClicks,
          topByRating,
          categoryStats,
        },
      }, { status: 200 });
    }

    let query: Record<string, any> = {};
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (featured === "true") query.isFeatured = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const brands = await ShoppingBrandModel.find(query).sort({ isFeatured: -1, clicks: -1 });
    return NextResponse.json({ data: brands }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch brands" },
      { status: 500 },
    );
  }
}

// POST: Create a new brand
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const brand = await ShoppingBrandModel.create(body);
    return NextResponse.json({ data: brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create brand" },
      { status: 500 },
    );
  }
}

// PUT: Update a brand OR increment clicks
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, incrementClick, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    let brand;
    if (incrementClick) {
      brand = await ShoppingBrandModel.findByIdAndUpdate(
        _id,
        { $inc: { clicks: 1 } },
        { new: true },
      );
    } else {
      brand = await ShoppingBrandModel.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });
    }

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ data: brand }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update brand" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a brand OR a single review
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const reviewId = searchParams.get("reviewId");

  if (!id) {
    return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
  }

  await loadDB();
  try {
    // ── Delete a single review subdocument ──────────────────────────────────
    if (reviewId) {
      const brand = await ShoppingBrandModel.findByIdAndUpdate(
        id,
        { $pull: { reviews: { _id: reviewId } } },
        { new: true },
      );
      if (!brand) {
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }
      return NextResponse.json({ message: "Review deleted", data: brand }, { status: 200 });
    }

    // ── Delete the whole brand ───────────────────────────────────────────────
    const brand = await ShoppingBrandModel.findByIdAndDelete(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Brand deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete" },
      { status: 500 },
    );
  }
}

