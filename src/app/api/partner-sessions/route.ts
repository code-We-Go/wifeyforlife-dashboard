import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import PartnerSessionModel from "@/app/models/partnerSessionModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List partner sessions with optional filters and sorting
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");
  const sortBy = searchParams.get("sortBy") || "order";

  await loadDB();
  const query: any = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { partnerName: { $regex: search, $options: "i" } },
    ];
  }
  if (isActive === "true") query.isActive = true;
  if (isActive === "false") query.isActive = false;

  try {
    const sortOption: any =
      sortBy === "date" || sortBy === "latest"
        ? { createdAt: -1 }
        : { order: 1, createdAt: -1 };

    const sessions = await PartnerSessionModel.find(query).sort(sortOption);
    return NextResponse.json({ data: sessions }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch partner sessions" },
      { status: 500 },
    );
  }
}

// POST: Create a new partner session
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const session = await PartnerSessionModel.create(body);
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create partner session" },
      { status: 500 },
    );
  }
}

// PUT: Update an existing partner session
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const updated = await PartnerSessionModel.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update partner session" },
      { status: 500 },
    );
  }
}

// PATCH: Reorder sessions or update order
export async function PATCH(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    if (body.orderedIds && Array.isArray(body.orderedIds)) {
      const bulkOps = body.orderedIds.map((id: string, idx: number) => ({
        updateOne: {
          filter: { _id: id },
          update: { order: idx },
        },
      }));
      await PartnerSessionModel.bulkWrite(bulkOps);
      return NextResponse.json(
        { success: true, message: "Order updated successfully" },
        { status: 200 }
      );
    }

    if (body.id && typeof body.featured === "boolean") {
      const updated = await PartnerSessionModel.findByIdAndUpdate(
        body.id,
        { featured: body.featured },
        { new: true }
      );
      return NextResponse.json({ data: updated }, { status: 200 });
    }

    if (body.id && typeof body.order === "number") {
      const updated = await PartnerSessionModel.findByIdAndUpdate(
        body.id,
        { order: body.order },
        { new: true }
      );
      return NextResponse.json({ data: updated }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update partner session order" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a partner session
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 },
    );
  }

  await loadDB();
  try {
    const deleted = await PartnerSessionModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Session deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete partner session" },
      { status: 500 },
    );
  }
}
