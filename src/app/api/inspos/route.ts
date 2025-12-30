import { NextRequest, NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import InspoModel from "@/app/models/insposModel";

export async function GET(req: Request) {
  try {
    await ConnectDB();
    const inspos = await InspoModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ data: inspos }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch inspos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ConnectDB();
    const body = await req.json();
    const newInspo = await InspoModel.create(body);
    return NextResponse.json({ data: newInspo }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create inspo" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();

    if (!id) {
       return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updatedInspo = await InspoModel.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ data: updatedInspo }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update inspo" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ConnectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
       return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await InspoModel.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete inspo" }, { status: 500 });
  }
}
