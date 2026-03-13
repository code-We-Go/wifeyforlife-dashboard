import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import ShoppingBrandModel from "@/app/models/shoppingBestieModel";
import mongoose from "mongoose";
import UserModel from "@/app/models/userModel";

const loadDB = async () => { await ConnectDB(); };

// GET: Fetch all reviews for a brand (with voter names manually populated) OR fetch all reviews across all brands
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");

  await loadDB();
  try {
    if (!brandId) {
      // IF NO BRAND ID: Fetch all reviews across all brands, sorted by latest
      const allReviewsPipeline = [
        { $unwind: "$reviews" },
        { $sort: { "reviews.createdAt": -1 } },
        { $project: {
            "reviews": 1,
            "brandName": "$name",
            "brandId": "$_id",
            "brandLogo": "$logo"
          }
        }
      ];

      const rawReviews = await ShoppingBrandModel.aggregate(allReviewsPipeline as any[]);
      
      // Collect all user IDs to populate
      const allUserIds = new Set<string>();
      for (const item of rawReviews) {
        if (item.reviews.userId) allUserIds.add(String(item.reviews.userId));
        for (const id of [...(item.reviews.helpful ?? []), ...(item.reviews.notHelpful ?? [])]) {
          allUserIds.add(String(id));
        }
      }

      // Single query for all users
      const userMap = new Map<string, { _id: string; firstName: string; lastName: string; username: string }>();
      if (allUserIds.size > 0) {
        const users = await UserModel.find(
          { _id: { $in: [...allUserIds] } },
          "firstName lastName username"
        ).lean();
        for (const u of users as any[]) {
          userMap.set(String(u._id), u);
        }
      }

      // Map back and structure the response
      const fullyPopulatedReviews = rawReviews.map((item: any) => ({
        ...item.reviews,
        brandId: item.brandId,
        brandName: item.brandName,
        brandLogo: item.brandLogo,
        resolvedUser: item.reviews.userId ? (userMap.get(String(item.reviews.userId)) ?? null) : null,
        helpful: (item.reviews.helpful ?? []).map((id: any) => userMap.get(String(id)) ?? { _id: String(id) }),
        notHelpful: (item.reviews.notHelpful ?? []).map((id: any) => userMap.get(String(id)) ?? { _id: String(id) }),
      }));

      return NextResponse.json({ data: fullyPopulatedReviews }, { status: 200 });
    }

    // EXISTING LOGIC for a single brand
    const brand = await ShoppingBrandModel.findById(brandId).select("name reviews").lean();
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Collect all unique user IDs: review authors + voters
    const allUserIds = new Set<string>();
    for (const r of (brand as any).reviews ?? []) {
      if (r.userId) allUserIds.add(String(r.userId));
      for (const id of [...(r.helpful ?? []), ...(r.notHelpful ?? [])]) {
        allUserIds.add(String(id));
      }
    }

    // Single users query covering both authors and voters
    const userMap = new Map<string, { _id: string; firstName: string; lastName: string; username: string }>();
    if (allUserIds.size > 0) {
      const users = await UserModel.find(
        { _id: { $in: [...allUserIds] } },
        "firstName lastName username"
      ).lean();
      for (const u of users as any[]) {
        userMap.set(String(u._id), u);
      }
    }

    // Stitch user objects back into each review's helpful / notHelpful,
    // and attach the resolved author as `resolvedUser`
    const reviewsWithVoters = ((brand as any).reviews ?? []).map((r: any) => ({
      ...r,
      resolvedUser: r.userId ? (userMap.get(String(r.userId)) ?? null) : null,
      helpful: (r.helpful ?? []).map((id: any) => userMap.get(String(id)) ?? { _id: String(id) }),
      notHelpful: (r.notHelpful ?? []).map((id: any) => userMap.get(String(id)) ?? { _id: String(id) }),
    }));

    return NextResponse.json({ data: { ...(brand as any), reviews: reviewsWithVoters } }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST: Add a review to a brand
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { brandId, userName, rating, comment, images } = body;

    if (!brandId || !userName || !rating) {
      return NextResponse.json(
        { error: "brandId, userName and rating are required" },
        { status: 400 }
      );
    }

    const brand = await ShoppingBrandModel.findById(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Use a dummy ObjectId for admin-created reviews (no real userId)
    const newReview = {
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      userName: userName.trim(),
      rating: Number(rating),
      comment: comment?.trim() || "",
      images: Array.isArray(images) ? images : [],
      helpful: [],
      notHelpful: [],
    };

    brand.reviews.push(newReview as any);
    await brand.save();

    return NextResponse.json({ data: brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to add review" },
      { status: 500 }
    );
  }
}

// PUT: Edit an existing review (rating, comment, helpful, notHelpful)
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { brandId, reviewId, userName, rating, comment, helpful, notHelpful, images } = body;

    if (!brandId || !reviewId) {
      return NextResponse.json(
        { error: "brandId and reviewId are required" },
        { status: 400 }
      );
    }

    const brand = await ShoppingBrandModel.findById(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const review = (brand.reviews as any).id(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (userName !== undefined) review.userName = userName.trim();
    if (rating !== undefined) review.rating = Number(rating);
    if (comment !== undefined) review.comment = comment.trim();
    if (images !== undefined) review.images = Array.isArray(images) ? images : [];
    if (helpful !== undefined) (review as any).helpful = Array.isArray(helpful) ? helpful : [];
    if (notHelpful !== undefined) (review as any).notHelpful = Array.isArray(notHelpful) ? notHelpful : [];

    await brand.save();
    return NextResponse.json({ data: brand }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a review from a brand
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId");
  const reviewId = searchParams.get("reviewId");

  if (!brandId || !reviewId) {
    return NextResponse.json(
      { error: "brandId and reviewId are required" },
      { status: 400 }
    );
  }

  await loadDB();
  try {
    const brand = await ShoppingBrandModel.findById(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const review = (brand.reviews as any).id(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    review.deleteOne();
    await brand.save();

    return NextResponse.json({ message: "Review deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
