import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import ShoppingBrandModel from "@/app/models/shoppingBestieModel";
import UserModel from "@/app/models/userModel";
import ShoppingSubcategoryModel from "@/app/models/shoppingSubcategoriesModel";
import ShoppingCategoryModel from "@/app/models/shoppingCategoriesModel";

const loadDB = async () => {
  await ConnectDB();
};

/** Populate helper: subCategories → { _id, name, slug, categoryId: { _id, name, slug } } */
const populateSubCats = {
  path: "subCategories",
  model: ShoppingSubcategoryModel,
  strictPopulate: false,
  populate: {
    path: "categoryId",
    model: ShoppingCategoryModel,
    select: "name slug _id",
    strictPopulate: false,
  },
  select: "name slug categoryId _id",
};

// GET: List all brands with optional filtering & analytics summary
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Accept both an ObjectId or a name string for filtering
  const subCategoryId = searchParams.get("subCategoryId");
  const categoryId    = searchParams.get("categoryId");
  const search        = searchParams.get("search");
  const featured      = searchParams.get("featured");
  const analytics     = searchParams.get("analytics");
  const pending       = searchParams.get("pending"); // "true" = unapproved brands queue

  await loadDB();
  // Ensure referenced models are registered
  console.log(UserModel + " registration");

  try {
    // ── Analytics mode ──────────────────────────────────────────────────────
    if (analytics === "true") {
      const totalBrands  = await ShoppingBrandModel.countDocuments({});
      const activeBrands = await ShoppingBrandModel.countDocuments({ isActive: true });
      const totalClicks  = await ShoppingBrandModel.aggregate([
        { $group: { _id: null, total: { $sum: "$clicks" } } },
      ]);

      const reviewStats = await ShoppingBrandModel.aggregate([
        { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, avg: { $avg: "$reviews.rating" }, total: { $sum: 1 } } },
      ]);

      // ── Top 5 by clicks (populate after aggregation) ──
      const topByClicksRaw = await ShoppingBrandModel.aggregate([
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
        { $project: { name: 1, clicks: 1, averageRating: 1, totalRatings: 1, logo: 1, subCategories: 1 } },
      ]);

      // ── Top 5 by rating (populate after aggregation) ──
      const topByRatingRaw = await ShoppingBrandModel.aggregate([
        { $match: { "reviews.0": { $exists: true } } },
        {
          $addFields: {
            averageRating: { $avg: { $map: { input: "$reviews", as: "r", in: "$$r.rating" } } },
            totalRatings:  { $size: "$reviews" },
          },
        },
        { $sort: { averageRating: -1 } },
        { $limit: 5 },
        { $project: { name: 1, clicks: 1, averageRating: 1, totalRatings: 1, logo: 1, subCategories: 1 } },
      ]);

      // ── Category stats: join through subcategories ──
      const categoryStats = await ShoppingBrandModel.aggregate([
        { $unwind: { path: "$subCategories", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "shoppingsubcategories",
            localField: "subCategories",
            foreignField: "_id",
            as: "subCatDoc",
          },
        },
        { $unwind: { path: "$subCatDoc", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: "shoppingcategories",
            localField: "subCatDoc.categoryId",
            foreignField: "_id",
            as: "catDoc",
          },
        },
        { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: { catId: "$catDoc._id", catName: "$catDoc.name" },
            count: { $addToSet: "$_id" },
            totalClicks: { $sum: "$clicks" },
          },
        },
        {
          $project: {
            _id: "$_id.catId",
            name: "$_id.catName",
            count: { $size: "$count" },
            totalClicks: 1,
          },
        },
        { $sort: { totalClicks: -1 } },
      ]);

      // Populate subCategories in agg results via Mongoose
      const [topByClicks, topByRating] = await Promise.all([
        ShoppingBrandModel.populate(topByClicksRaw, populateSubCats as any),
        ShoppingBrandModel.populate(topByRatingRaw, populateSubCats as any),
      ]);

      return NextResponse.json({
        data: {
          totalBrands,
          activeBrands,
          totalClicks: totalClicks[0]?.total ?? 0,
          avgRating:   reviewStats[0]?.avg   ?? 0,
          totalReviews: reviewStats[0]?.total ?? 0,
          topByClicks,
          topByRating,
          categoryStats,
        },
      }, { status: 200 });
    }

    // ── Pending approvals listing ────────────────────────────────────────────
    if (pending === "true") {
      const pendingBrands = await ShoppingBrandModel
        .find({ approved: false })
        .populate(populateSubCats as any)
        .populate({
          path: "submittedBy",
          model: UserModel,
          select: "firstName lastName username _id",
          strictPopulate: false,
        })
        .sort({ createdAt: -1 });
      return NextResponse.json({ data: pendingBrands }, { status: 200 });
    }

    // ── Normal brand listing (approved only) ────────────────────────────────
    const query: Record<string, any> = { approved: true };

    // Filter by subCategory ObjectId directly
    if (subCategoryId) {
      query.subCategories = { $in: [subCategoryId] };
    }

    // Filter by parent category: find all subcategory ids for that category first
    if (categoryId) {
      const subs = await ShoppingSubcategoryModel.find({ categoryId }, "_id").lean();
      const subIds = subs.map((s: any) => s._id);
      query.subCategories = { $in: subIds };
    }

    if (featured === "true") query.isFeatured = true;
    if (search) {
      query.$or = [
        { name:        { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags:        { $in: [new RegExp(search, "i")] } },
      ];
    }

    const brands = await ShoppingBrandModel
      .find(query)
      .populate(populateSubCats as any)
      .sort({ isFeatured: -1, clicks: -1 });

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
    const body  = await request.json();
    const brand = await ShoppingBrandModel.create(body);
    const populated = await brand.populate(populateSubCats as any);
    return NextResponse.json({ data: populated }, { status: 201 });
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
    const { _id, incrementClick, approveBrand, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: "Brand ID is required" }, { status: 400 });
    }

    let brand;
    if (incrementClick) {
      brand = await ShoppingBrandModel.findByIdAndUpdate(
        _id,
        { $inc: { clicks: 1 } },
        { new: true },
      ).populate(populateSubCats as any);
    } else if (approveBrand) {
      // Approve a pending brand — flip approved to true
      brand = await ShoppingBrandModel.findByIdAndUpdate(
        _id,
        { $set: { approved: true } },
        { new: true },
      ).populate(populateSubCats as any);
    } else {
      brand = await ShoppingBrandModel.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      }).populate(populateSubCats as any);
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
  const id       = searchParams.get("id");
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
      ).populate(populateSubCats as any);
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
