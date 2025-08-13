import { NextRequest, NextResponse } from "next/server";
import { getBanners, updateBanner } from "@/app/models/bannersModel";
import { ConnectDB } from "@/config/db";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET(req: NextRequest) {
  try {
    const banner = await getBanners();
    return NextResponse.json({ data: banner }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateBanner(body);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 },
    );
  }
}
