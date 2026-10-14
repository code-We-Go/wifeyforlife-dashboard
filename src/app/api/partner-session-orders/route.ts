import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import PartnerSessionOrderModel from "@/app/models/partnerSessionOrderModel";
import PartnerSessionModel from "@/app/models/partnerSessionModel";

const loadDB = async () => {
  await ConnectDB();
};

// GET: List partner session orders with optional filters
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const clientEmail = searchParams.get("clientEmail");
  const sessionId = searchParams.get("sessionId");
  const paymentMethod = searchParams.get("paymentMethod");

  await loadDB();
  const query: any = {};
  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
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

    // Synchronize PartnerSession.bookings if status changed
    if (updateData.status && updated.sessionId) {
      try {
        if (updateData.status === "failed" || updateData.status === "cancelled") {
          // Remove from bookings array so the spot is released immediately
          await PartnerSessionModel.findByIdAndUpdate(updated.sessionId, {
            $pull: { bookings: { orderId: String(_id) } },
          });
        } else {
          // Update status in bookings array (e.g. paid)
          await PartnerSessionModel.updateOne(
            { _id: updated.sessionId, "bookings.orderId": String(_id) },
            { $set: { "bookings.$.status": updateData.status } }
          );
        }
      } catch (syncErr) {
        console.error("Failed to sync booking status to PartnerSession:", syncErr);
      }
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

    // Automatically remove booking record from the session to free up capacity
    if (deleted.sessionId) {
      try {
        await PartnerSessionModel.findByIdAndUpdate(deleted.sessionId, {
          $pull: { bookings: { orderId: String(id) } },
        });
      } catch (syncErr) {
        console.error("Failed to remove booking from PartnerSession on order delete:", syncErr);
      }
    }

    return NextResponse.json({ message: "Order deleted successfully" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete session order" },
      { status: 500 },
    );
  }
}
