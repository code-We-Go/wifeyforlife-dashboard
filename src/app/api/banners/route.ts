import { NextRequest, NextResponse } from "next/server";

import { getBanners, updateBanner } from "@/app/models/bannersModel";
import { ConnectDB } from "@/config/db";

export async function GET(req: Request) {
  try {
    await ConnectDB();
    const banner = await getBanners();
    return NextResponse.json({ data: banner }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    await ConnectDB();
    const body = await req.json();
    console.log("banner" + JSON.stringify(body));
    const updated = await updateBanner(body);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 },
    );
  }
}
