import ordersModel from "@/app/models/ordersModel";
import { ConnectDB } from "@/config/db";
import { NextResponse } from "next/server";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const week = url.searchParams.get("week"); // Get the week parameter (thisWeek, lastWeek, or all)

    let query: any = {};

    if (week === "all") {
      // Return all orders (no date filter) — used for monthly charts
      query = {};
    } else {
      const today = new Date();
      let startOfWeek: Date;
      let endOfWeek: Date;

      if (week === "lastWeek") {
        // Get the start and end of last week (Sunday to Saturday)
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() - 7); // Get Sunday of last week
        startOfWeek.setHours(0, 0, 0, 0); // Set time to 00:00:00

        endOfWeek = new Date(startOfWeek); // End of last week (Saturday)
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get Saturday
        endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59
      } else {
        // Get the start and end of this week (Sunday to Saturday)
        startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Get Sunday of this week
        startOfWeek.setHours(0, 0, 0, 0); // Set time to 00:00:00

        endOfWeek = new Date(startOfWeek); // End of this week (Saturday)
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get Saturday
        endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59
      }

      query = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
    }

    // Fetch orders
    const orders = await ordersModel.find(query).sort({ createdAt: -1 });
    console.log('here'+orders.length);
    return NextResponse.json({ data: orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
