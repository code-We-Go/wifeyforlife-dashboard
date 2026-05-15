import { NextResponse } from "next/server";
import { ConnectDB } from "@/config/db";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import subscriptionPaymentModel from "@/app/models/subscriptionPaymentModel";
import packageModel from "@/app/models/packageModel";
import mongoose from "mongoose";
import PackagesPage from "@/app/pages/packages/page";
import { DiscountModel } from "@/models/Discount";
import UserModel from "@/app/models/userModel";
import playlistModel from "@/app/models/playlistModel";

const loadDB = async () => {
  await ConnectDB();
};
console.log("registering" + packageModel);
// GET: List all subscriptions, populate package data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const subscribed = searchParams.get("subscribed"); // "true" or "false"
  const type = searchParams.get("type"); // "real", "gift", "all"
  const isGift = searchParams.get("isGift"); // "true" or "false"
  const packageID = searchParams.get("packageID"); // Package ID for filtering
  const paymentMethod = searchParams.get("paymentMethod"); // Payment method for filtering
  const status = searchParams.get("status"); // Shipment status for filtering

  await loadDB();
  let query: any = {};

  if (email) {
    query.email = { $regex: email, $options: "i" };
  }

  if (status && status !== "all") {
    query.status = status;
  }

  if (type === "real") {
    query.subTotal = { $gt: 1000 };
  } else if (type === "gift") {
    query.subTotal = { $lte: 1000 };
  }

  if (isGift === "true") {
    query.isGift = true;
  } else if (isGift === "false") {
    query.isGift = false;
  }

  if (packageID && packageID !== "all") {
    query.packageID = new mongoose.Types.ObjectId(packageID);
  }

  if (paymentMethod && paymentMethod !== "all") {
    console.log("paymentMethodPaymob", paymentMethod);
    if (paymentMethod === "paymob") {
      query.paymentMethod = { $not: /instapay/i };
    } else {
      query.paymentMethod = paymentMethod;
    }
  }


  // New filters for Mini Experience
  const startDate = searchParams.get("startDate");
  const miniSubscriptionActivated = searchParams.get("miniSubscriptionActivated");

  if (startDate) {
    query.createdAt = { $gte: new Date(startDate) };
  }

  const isMini = searchParams.get("isMini");
  if (isMini === "true" && (!packageID || packageID === "all")) {
    const miniPackages = await packageModel.find({
      name: { $regex: "mini", $options: "i" },
    });
    if (miniPackages.length > 0) {
      query.packageID = { $in: miniPackages.map((p) => p._id) };
    }
  }

  if (miniSubscriptionActivated === "true") {
    query.miniSubscriptionActivated = true;
  } else if (miniSubscriptionActivated === "false") {
    query.miniSubscriptionActivated = { $ne: true };
  }

  try {
    let subscriptions;

    // Dedicated path for instapay — query subscriptionPaymentModel directly
    if (paymentMethod === "instapay") {
      const instapayQuery = { ...query };
      instapayQuery.paymentMethod = "instapay";

      subscriptions = await subscriptionPaymentModel
        .find(instapayQuery)
        .populate({
          path: "packageID",
          model: packageModel,
          options: { strictPopulate: false },
        })
        .populate({
          path: "appliedDiscount",
          model: DiscountModel,
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 })
        .lean();
    }
    // Dedicated path for paymob — query subscriptionPaymentModel excluding instapay
    else if (paymentMethod === "paymob") {
      const paymobQuery = { ...query };
      paymobQuery.paymentMethod = { $ne: "instapay" };

      subscriptions = await subscriptionPaymentModel
        .find(paymobQuery)
        .populate({
          path: "packageID",
          model: packageModel,
          options: { strictPopulate: false },
        })
        .populate({
          path: "appliedDiscount",
          model: DiscountModel,
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 })
        .lean();
    }
    //paymobFailed
    else if (subscribed === "false") {
      // Fetch from subscriptionPaymentModel for failed/unconfirmed payments
      // The user requested "records which status is not confirmed"
      const paymentQuery = { ...query };
      paymentQuery.status = { $ne: "confirmed" };

      const subQuery = { ...query };
      subQuery.subscribed = false;

      let paymentResults = await subscriptionPaymentModel
        .find(paymentQuery)
        .populate({
          path: "packageID",
          model: packageModel,
          options: { strictPopulate: false },
        })
        .populate({
          path: "appliedDiscount",
          model: DiscountModel,
          options: { strictPopulate: false },
        })
        .lean();

      let subResults: any[] = [];
      if (paymentMethod !== "instapay") {
        subResults = await subscriptionsModel
          .find(subQuery)
          .populate({
            path: "packageID",
            model: packageModel,
            options: { strictPopulate: false },
          })
          .populate({
            path: "allowedPlaylists.playlistID",
            model: playlistModel,
            select: "title thumbnailUrl",
            options: { strictPopulate: false },
          })
          .populate({
            path: "appliedDiscount",
            model: DiscountModel,
            options: { strictPopulate: false },
          })
          .lean();
      }

      // Combine and sort results
      subscriptions = [...paymentResults, ...subResults].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else {
      // Default behavior: Fetch from subscriptionsModel
      if (subscribed === "true") {
        query.subscribed = true;
      }

      subscriptions = await subscriptionsModel
        .find(query)
        .populate({
          path: "packageID",
          model: packageModel,
          options: { strictPopulate: false },
        })
        .populate({
          path: "allowedPlaylists.playlistID",
          model: playlistModel,
          select: "title thumbnailUrl",
          options: { strictPopulate: false },
        })
        .populate({
          path: "appliedDiscount",
          model: DiscountModel,
          options: { strictPopulate: false },
        })
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ data: subscriptions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

// POST: Create a new subscription
export async function POST(request: Request) {
  try {
    let body = await request.json();
    // Convert empty strings to null for ObjectId fields
    if (body.appliedDiscount === "") body.appliedDiscount = null;
    if (body.packageID === "") body.packageID = null;

    if (body.appliedDiscount && typeof body.appliedDiscount === "string") {
      // Try to find by code
      const discount = await DiscountModel.findOne({
        code: body.appliedDiscount,
      });
      if (discount) {
        body.appliedDiscount = discount._id;
      } else if (!mongoose.Types.ObjectId.isValid(body.appliedDiscount)) {
        return NextResponse.json(
          { error: "Invalid discount code" },
          { status: 400 },
        );
      }
    }

    // You can add more fields here if needed
    console.log(JSON.stringify(body));
    const newSubscription = await subscriptionsModel.create(body);
    
    // Update user if email is provided
    if (body.email) {
      await UserModel.findOneAndUpdate(
        { email: body.email },
        { $addToSet: { subscriptions: newSubscription._id } },
        { new: true }
      );
    }

    // Add email to Brevo list based on package type
    if (body.email && body.packageID) {
      console.log("Adding email to Brevo list" + body.email);
      try {
        // Fetch package details to determine which list to use
        const packageDetails = await packageModel.findById(body.packageID);
        
        if (packageDetails) {
          const brevoApiKey2 = process.env.BREVO_API_KEY;
          if (brevoApiKey2) {
            // Determine list ID based on package name
            // listIds [4] for miniExperience 
            // listIds [5] for fullWifeyExperience
            const packageName = packageDetails.name.toLowerCase();
            let listId: number;
            
            if (packageName.includes("mini")) {
              listId = 4; // Mini Experience
            } else {
              listId = 5; // Full Wifey Experience
            }
            
            await fetch("https://api.brevo.com/v3/contacts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "api-key": brevoApiKey2,
              },
              body: JSON.stringify({
                email: body.email,
                listIds: [listId],
                updateEnabled: true,
              }),
            });
          }
        }
      } catch (brevoError) {
        // Log error but don't fail the subscription creation
        console.error("Failed to add email to Brevo list:", brevoError);
      }
    }

    return NextResponse.json({ data: newSubscription }, { status: 201 });
  } catch (error: any) {
    // Return mongoose validation errors if present
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}

// PUT: Update a subscription by ID
export async function PUT(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const subscriptionID = searchParams.get("subscriptionID");
  if (!subscriptionID) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 },
    );
  }
  try {
    let body = await request.json();
    // Convert empty strings to null for ObjectId fields
    if (body.appliedDiscount === "") body.appliedDiscount = null;
    if (body.packageID === "") body.packageID = null;

    if (body.appliedDiscount && typeof body.appliedDiscount === "string") {
      // Try to find by code
      const discount = await DiscountModel.findOne({
        code: body.appliedDiscount,
      });
      if (discount) {
        body.appliedDiscount = discount._id;
      } else if (!mongoose.Types.ObjectId.isValid(body.appliedDiscount)) {
        return NextResponse.json(
          { error: "Invalid discount code" },
          { status: 400 },
        );
      }
    }

    // Validate apartment is a string
    if (body.apartment !== undefined && typeof body.apartment !== "string") {
      return NextResponse.json(
        {
          error: `Apartment must be a string. Received: ${JSON.stringify(body.apartment)} (type: ${typeof body.apartment})`,
        },
        { status: 400 },
      );
    }
    // Validate state is present
    if (body.state !== undefined && typeof body.state !== "string") {
      return NextResponse.json(
        {
          error: `State must be a string. Received: ${JSON.stringify(body.state)} (type: ${typeof body.state})`,
        },
        { status: 400 },
      );
    }
    console.log(JSON.stringify(body));
    const updated = await subscriptionsModel.findByIdAndUpdate(
      subscriptionID,
      body,
      { new: true, runValidators: true },
    );
    if (!updated) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a subscription by ID
export async function DELETE(request: Request) {
  await loadDB();
  const { searchParams } = new URL(request.url);
  const subscriptionID = searchParams.get("subscriptionID");
  if (!subscriptionID) {
    return NextResponse.json(
      { error: "Subscription ID is required" },
      { status: 400 },
    );
  }
  try {
    // Try to find in subscriptionsModel first
    let subscription = await subscriptionsModel.findById(subscriptionID);
    let fromPaymentModel = false;

    if (!subscription) {
      // If not found, try subscriptionPaymentModel
      subscription = await subscriptionPaymentModel.findById(subscriptionID);
      fromPaymentModel = true;
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }

    // Remove from user's subscriptions array before deleting the subscription itself
    if (subscription.email) {
      await UserModel.findOneAndUpdate(
        { email: subscription.email },
        { $pull: { subscriptions: new mongoose.Types.ObjectId(subscriptionID) } }
      );
    }

    if (fromPaymentModel) {
      await subscriptionPaymentModel.findByIdAndDelete(subscriptionID);
    } else {
      await subscriptionsModel.findByIdAndDelete(subscriptionID);
    }

    return NextResponse.json(
      { message: "Subscription deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 },
    );
  }
}
