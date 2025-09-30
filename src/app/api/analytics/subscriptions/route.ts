import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

// GET: Get subscription analytics data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // Format: YYYY-MM
  const packageId = searchParams.get("packageId"); // Optional package filter

  await loadDB();

  try {
    // Parse month parameter or use current month
    let startDate, endDate;
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      startDate = new Date(year, monthNum - 1, 1);
      endDate = new Date(year, monthNum, 0); // Last day of month
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Build query
    let query: any = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    // Add package filter if provided
    if (packageId) {
      query.packageID = new mongoose.Types.ObjectId(packageId);
    }

    // Get subscriptions with package details
    const subscriptions = await subscriptionsModel
      .find(query)
      .populate({
        path: "packageID",
        model: packageModel,
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    // Calculate analytics
    const totalSubscriptions = subscriptions.length;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscounts = 0;
    let totalProfit = 0;
    let totalShippingCost = 0;
    let totalRedeemedPoints = 0;
    let totalRedeemedPointsValue = 0; // in pounds (20 points = 1 pound)
    let totalPaymobFees = 0; // 2.75% of total, 0 if isGift

    // Group by package
    const packageStats: Record<
      string,
      {
        name: string;
        count: number;
        revenue: number;
        cost: number;
        discounts: number;
        profit: number;
        shippingCost: number;
        redeemedPoints: number;
        redeemedPointsValue: number;
        paymobFees: number;
      }
    > = {};

    // Process each subscription
    subscriptions.forEach((sub) => {
      const pkg = sub.packageID as any;
      if (!pkg) return;

      // Calculate revenue from total, cost and profit
      const subTotal = sub.subTotal || 0;
      const total = sub.total || 0;
      const revenue = total || pkg.price || 0; // Use total as revenue
      const cost = parseFloat(pkg.cost) || 0;
      const discount = sub.appliedDiscountAmount || 0; // Keep discount as is

      // Calculate shipping costs when total is not equal to subTotal
      const shippingCost = sub.shipping;

      // Calculate redeemed points and their value (20 points = 1 pound)
      const redeemedPoints = sub.redeemedLoyaltyPoints || 0;
      const redeemedPointsValue = redeemedPoints / 20; // Convert to pounds

      // Calculate Paymob fees (2.75% of total, 0 if isGift)
      const paymobFees = sub.isGift ? 0 : (total * 0.0275);

      // Calculate profit (revenue - cost - shipping - paymob fees)
      const profit = revenue - cost - shippingCost - paymobFees;

      // Add to totals
      totalRevenue += revenue;
      totalCost += cost;
      totalDiscounts += discount;
      totalShippingCost += shippingCost;
      totalRedeemedPoints += redeemedPoints;
      totalRedeemedPointsValue += redeemedPointsValue;
      totalPaymobFees += paymobFees;
      // Calculate profit as revenue minus cost minus shipping cost minus paymob fees
      totalProfit += profit;

      // Add to package stats
      if (!packageStats[pkg._id]) {
        packageStats[pkg._id] = {
          name: pkg.name,
          count: 0,
          revenue: 0,
          cost: 0,
          discounts: 0,
          profit: 0,
          shippingCost: 0,
          redeemedPoints: 0,
          redeemedPointsValue: 0,
          paymobFees: 0,
        };
      }

      packageStats[pkg._id].count++;
      packageStats[pkg._id].revenue += revenue;
      packageStats[pkg._id].cost += cost;
      packageStats[pkg._id].discounts += discount;
      packageStats[pkg._id].shippingCost += shippingCost;
      packageStats[pkg._id].redeemedPoints += redeemedPoints;
      packageStats[pkg._id].redeemedPointsValue += redeemedPointsValue;
      packageStats[pkg._id].paymobFees += paymobFees;
      // Calculate profit as revenue minus cost minus shipping cost minus paymob fees
      packageStats[pkg._id].profit =
        packageStats[pkg._id].revenue -
        packageStats[pkg._id].cost -
        packageStats[pkg._id].shippingCost -
        packageStats[pkg._id].paymobFees;
    });

    // Get all packages for the dropdown
    const allPackages = await packageModel.find({}).sort({ name: 1 });

    return NextResponse.json(
      {
        data: {
          period: {
            startDate,
            endDate,
          },
          summary: {
            totalSubscriptions,
            totalRevenue,
            totalCost,
            totalDiscounts,
            totalShippingCost,
            totalProfit,
            totalRedeemedPoints,
            totalRedeemedPointsValue,
            totalPaymobFees,
          },
          packageStats: Object.values(packageStats),
          allPackages: allPackages.map((pkg) => ({
            _id: pkg._id,
            name: pkg.name,
          })),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription analytics" },
      { status: 500 },
    );
  }
}
