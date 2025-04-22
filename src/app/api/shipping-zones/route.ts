import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";
import shippingZonesModel from "@/app/models/shippingZonesModel";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

// GET ALL or GET ONE by ID
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneID = searchParams.get("zoneID");

  try {
    if (!zoneID) {
      const zones = await shippingZonesModel.find().sort({ createdAt: -1 });
      return NextResponse.json(zones, { status: 200 });
    } else {
      const zone = await shippingZonesModel.findById(zoneID);
      return NextResponse.json({ data: zone }, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch zones" }, { status: 500 });
  }
}

// CREATE
export async function POST(req: Request) {
  const body = await req.json();
  console.log(body)

  try {
    const newZone = await shippingZonesModel.create(body);
    return NextResponse.json(newZone, { status: 201 });
  } catch (error: any) {
    console.error("Server error:", error)
    return NextResponse.json({ error: error.message || "Failed to create zone" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: Request) {
  const body = await req.json();

  try {
    const res = await shippingZonesModel.findByIdAndDelete(body.zoneID);
    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneID = searchParams.get("zoneID");
  const body = await req.json();

  try {
    const updated = await shippingZonesModel.findByIdAndUpdate(zoneID, body, {
      new: true,
      runValidators: true,
    });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
