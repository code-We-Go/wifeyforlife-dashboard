import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import PartnerSessionOrderModel from "@/app/models/partnerSessionOrderModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List partner session orders with optional filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientEmail = searchParams.get("clientEmail");
  const sessionId = searchParams.get("sessionId");

  await loadDB();
  const query: any = {};
  if (status) query.status = status;
  if (clientEmail) query.clientEmail = { $regex: clientEmail, $options: "i" };
  if (sessionId) query.sessionId = sessionId;

  try {
    const orders = await PartnerSessionOrderModel.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ data: orders }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch session orders" },
      { status: 500 },
    );
  }
}

// POST: Create a new partner session order
export async function POST(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const order = await PartnerSessionOrderModel.create(body);
    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create session order" },
      { status: 500 },
    );
  }
}

// PUT: Update a partner session order
export async function PUT(request: Request) {
  await loadDB();
  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const updated = await PartnerSessionOrderModel.findByIdAndUpdate(_id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update session order" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a partner session order
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Order ID is required" },
      { status: 400 },
    );
  }

  await loadDB();
  try {
    const deleted = await PartnerSessionOrderModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete session order" },
      { status: 500 },
    );
  }
}

