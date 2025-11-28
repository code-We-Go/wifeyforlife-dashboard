import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import PartnerSessionModel from "@/app/models/partnerSessionModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List partner sessions with optional filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const isActive = searchParams.get("isActive");

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
    const sessions = await PartnerSessionModel.find(query).sort({ createdAt: -1 });
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

