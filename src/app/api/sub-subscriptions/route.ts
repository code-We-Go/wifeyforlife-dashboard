import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import SubSubscriptionModel from "@/app/models/subSubscriptionModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List sub-subscriptions, optionally filtered by parentSubscription
export async function GET(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const parentSubscription = searchParams.get("parentSubscription");
  const id = searchParams.get("id");

  try {
    if (id) {
      const subSub = await SubSubscriptionModel.findById(id)
        .populate("inviteeUser", "email firstName lastName")
        .lean();
      if (!subSub) {
        return NextResponse.json(
          { error: "Sub-subscription not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: subSub }, { status: 200 });
    }

    const query: any = {};
    if (parentSubscription) {
      query.parentSubscription = parentSubscription;
    }

    const subSubscriptions = await SubSubscriptionModel.find(query)
      .populate("inviteeUser", "email firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: subSubscriptions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sub-subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sub-subscriptions" },
      { status: 500 }
    );
  }
}

// POST: Create a new sub-subscription
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const newSubSubscription = await SubSubscriptionModel.create(body);
    return NextResponse.json({ data: newSubSubscription }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sub-subscription:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create sub-subscription" },
      { status: 500 }
    );
  }
}

// PUT: Update a sub-subscription by ID
export async function PUT(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Sub-subscription ID is required" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const updated = await SubSubscriptionModel.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Sub-subscription not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating sub-subscription:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update sub-subscription" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a sub-subscription by ID
export async function DELETE(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Sub-subscription ID is required" },
      { status: 400 }
    );
  }
  try {
    const deleted = await SubSubscriptionModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Sub-subscription not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Sub-subscription deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sub-subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete sub-subscription" },
      { status: 500 }
    );
  }
}
