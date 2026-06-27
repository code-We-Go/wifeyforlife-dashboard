import ordersModel from "@/app/models/ordersModel";
import subscriptionsModel from "@/app/models/subscriptionsModel";
import packageModel from "@/app/models/packageModel";
import { ConnectDB } from "@/config/db";
import { DiscountModel } from "@/models/Discount";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

const loadDB = async () => {
  await ConnectDB();
};

loadDB();

function formatSubsAsOrder(subs: any[]) {
  // Sort subs by createdAt ascending so the earliest one (which holds discounts/points) is processed first
  const sortedSubs = [...subs].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // Find the master subscription that contains the full checkout details
  let master = sortedSubs.find(sub => !sub.isGift && (sub.billingFirstName || sub.email));
  if (!master) {
    master = sortedSubs.reduce((max, sub) => ((sub.total || 0) > (max.total || 0) ? sub : max), sortedSubs[0]);
  }
  
  const cart: any[] = [];

  sortedSubs.forEach((sub) => {
    if (sub.packageID) {
      const pkg = sub.packageID;
      const prodId = pkg._id?.toString() || pkg.toString();
      const attrName = sub.isGift
        ? `Gift to: ${sub.giftRecipientEmail || "Gift"}`
        : `For: ${sub.email || "Self"}`;

      const existing = cart.find(
        (item) => item.productId === prodId && item.attributes?.name === attrName
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        let price = pkg.price || 0;
        if (!sub.cart || sub.cart.length === 0) {
          price = sub.total !== undefined ? sub.total : price;
        }

        cart.push({
          productId: prodId,
          productName: pkg.name || "Package Subscription",
          price: price,
          originalPrice: pkg.price || 0,
          quantity: 1,
          imageUrl: pkg.imgUrl || (pkg.images && pkg.images[0]) || "",
          attributes: {
            name: attrName,
            stock: 1,
          },
          variant: {
            name: "",
            attributeName: "",
            attributes: [],
            images: [],
          },
        });
      }
    }

    if (sub.cart && Array.isArray(sub.cart)) {
      sub.cart.forEach((item: any) => {
        const prodId = item.productId || "";
        const attrName = item.attributes?.name || "";

        const existing = cart.find(
          (cItem) => cItem.productId === prodId && cItem.attributes?.name === attrName
        );

        if (existing) {
          existing.quantity += (item.quantity || 1);
        } else {
          cart.push({
            productId: prodId,
            productName: item.productName || "",
            price: item.price || 0,
            originalPrice: item.originalPrice || item.price || 0,
            quantity: item.quantity || 1,
            imageUrl: item.imageUrl || "",
            attributes: item.attributes || { name: "", stock: 0 },
            variant: item.variant || { name: "", attributeName: "", attributes: [], images: [] },
          });
        }
      });
    }
  });

  let calculatedSubTotal = 0;
  cart.forEach((item) => {
    calculatedSubTotal += (item.price || 0) * (item.quantity || 1);
  });

  const subTotal = calculatedSubTotal;
  let shipping = master.shipping || 0;
  const dbTotal = master.total || 0;
  const dbSubTotal = master.subTotal || 0;
  const dbDiscount = master.appliedDiscountAmount || 0;
  
  if (shipping !== (dbTotal - dbSubTotal + dbDiscount)) {
    shipping = 0;
  }

  const appliedDiscountAmount = dbDiscount;
  const total = Math.max(0, subTotal + shipping - appliedDiscountAmount);

  let paymentMethod = master.paymentMethod || "card";
  if (paymentMethod === "paymob") paymentMethod = "card";

  return {
    _id: master._id.toString(),
    orderID: master.paymentID,
    paymentID: master.paymentID,
    email: master.email || master.giftRecipientEmail || "",
    country: master.country || "",
    firstName: master.firstName || "",
    lastName: master.lastName || "",
    address: master.address || "",
    apartment: master.apartment || "",
    postalZip: master.postalZip || "",
    city: master.city || "",
    state: master.state || "",
    phone: master.phone || "",
    cash: paymentMethod,
    cart,
    subTotal,
    shipping,
    appliedDiscount: master.appliedDiscount || null,
    appliedDiscountAmount,
    redeemedLoyaltyPoints: master.redeemedLoyaltyPoints || 0,
    total,
    currency: master.currency || "EGP",
    status: master.status || "pending",
    payment: master.subscribed ? "confirmed" : "pending",
    billingCountry: master.billingCountry || "",
    billingFirstName: master.billingFirstName || "",
    billingState: master.billingState || "",
    billingLastName: master.billingLastName || "",
    billingAddress: master.billingAddress || "",
    billingApartment: master.billingApartment || "",
    billingPostalZip: master.billingPostalZip || "",
    billingCity: master.billingCity || "",
    billingPhone: master.billingPhone || "",
    instapayReciept: master.instapayReciept || "",
    createdAt: master.createdAt,
    updatedAt: master.updatedAt,
  };
}

export async function DELETE(request: Request) {
  const req = await request.json();
  const orderID = req.orderID;

  try {
    let isOrder = false;

    if (orderID && mongoose.Types.ObjectId.isValid(orderID)) {
      const exists = await ordersModel.findById(orderID);
      if (exists) {
        isOrder = true;
      }
    }

    if (isOrder) {
      const res = await ordersModel.findByIdAndDelete(orderID);
      return new Response(JSON.stringify(res), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      let sub = null;
      if (orderID && mongoose.Types.ObjectId.isValid(orderID)) {
        sub = await subscriptionsModel.findById(orderID);
      }

      if (sub && sub.paymentID) {
        const res = await subscriptionsModel.deleteMany({ paymentID: sub.paymentID });
        return new Response(JSON.stringify({ deletedCount: res.deletedCount }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        const res = await subscriptionsModel.deleteMany({ paymentID: orderID });
        return new Response(JSON.stringify({ deletedCount: res.deletedCount }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderID = searchParams.get("orderID");
  const req = await request.json();

  try {
    let res = null;
    let isOrder = false;

    if (orderID && mongoose.Types.ObjectId.isValid(orderID)) {
      res = await ordersModel.findById(orderID);
      if (res) {
        isOrder = true;
      }
    }

    if (isOrder) {
      const updated = await ordersModel.findByIdAndUpdate(orderID, req, {
        new: true,
        runValidators: true,
      });
      return NextResponse.json({ data: updated }, { status: 200 });
    } else {
      let pId = orderID;
      const sub = await subscriptionsModel.findById(orderID);
      if (sub && sub.paymentID) {
        pId = sub.paymentID;
      }

      const updateFields: any = {};
      if (req.status !== undefined) updateFields.status = req.status;
      if (req.payment !== undefined) {
        updateFields.subscribed = req.payment === "confirmed";
      }

      await subscriptionsModel.updateMany(
        { paymentID: pId },
        { $set: updateFields }
      );

      const subs = await subscriptionsModel
        .find({ paymentID: pId })
        .populate({
          path: "packageID",
          model: packageModel,
          options: { strictPopulate: false },
        })
        .populate({
          path: "appliedDiscount",
          model: DiscountModel,
          options: { strictPopulate: false },
        });

      if (subs.length > 0) {
        const formatted = formatSubsAsOrder(subs);
        return NextResponse.json({ data: formatted }, { status: 200 });
      }

      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get("page");
  const search = searchParams.get("search") || "";
  const discountCode = searchParams.get("discountCode");
  const orderDate = searchParams.get("orderDate");
  const email = searchParams.get("email");

  if (email) {
    try {
      const orders = await ordersModel.find({ email }).populate({
        path: "appliedDiscount",
        model: DiscountModel,
        options: { strictPopulate: false },
      });
      const subs = await subscriptionsModel.find({ email }).populate({
        path: "packageID",
        model: packageModel,
        options: { strictPopulate: false },
      }).populate({
        path: "appliedDiscount",
        model: DiscountModel,
        options: { strictPopulate: false },
      });

      const groupedSubs: { [paymentID: string]: any[] } = {};
      subs.forEach((sub) => {
        const pId = sub.paymentID || sub._id.toString();
        if (!groupedSubs[pId]) {
          groupedSubs[pId] = [];
        }
        groupedSubs[pId].push(sub);
      });
      const subOrders = Object.values(groupedSubs).map((group) => formatSubsAsOrder(group));

      const mappedOrders = orders.map((order: any) => {
        const obj = order.toObject ? order.toObject() : order;
        return {
          ...obj,
          paymentID: obj.orderID || "",
        };
      });

      const combined = [...mappedOrders, ...subOrders].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return NextResponse.json({ data: combined }, { status: 200 });
    } catch (error) {
      console.error("Error fetching orders for user:", error);
      return NextResponse.json(
        { error: "Failed to fetch orders for user" },
        { status: 500 },
      );
    }
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam) : 10;
  const page = pageParam ? parseInt(pageParam) : 1;
  const skip = (page - 1) * limit;

  const cash = searchParams.get("cash");
  const filter: any = {};
  if (cash) {
    filter.cash = cash;
  }
  if (discountCode) {
    try {
      const discount = await DiscountModel.findOne({
        code: { $regex: new RegExp(discountCode, "i") },
      });
      if (discount) {
        filter.appliedDiscount = discount._id;
      } else {
        filter.appliedDiscount = new mongoose.Types.ObjectId();
      }
    } catch (error) {
      console.error("Error searching discount code:", error);
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
    try {
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    } catch (error) {
      console.log("Invalid ObjectId format:", search);
    }
  }
  if (orderDate) {
    const startOfDay = new Date(orderDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(orderDate);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  const subFilter: any = {};
  if (cash) {
    if (cash === "card") {
      subFilter.paymentMethod = "paymob";
    } else {
      subFilter.paymentMethod = cash;
    }
  }
  if (discountCode) {
    try {
      const discount = await DiscountModel.findOne({
        code: { $regex: new RegExp(discountCode, "i") },
      });
      if (discount) {
        subFilter.appliedDiscount = discount._id;
      } else {
        subFilter.appliedDiscount = new mongoose.Types.ObjectId();
      }
    } catch (error) {
      console.error("Error searching discount code:", error);
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    subFilter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { giftSenderEmail: searchRegex },
      { giftRecipientEmail: searchRegex },
      { phone: searchRegex },
      { paymentID: searchRegex },
    ];
  }

  if (orderDate) {
    const startOfDay = new Date(orderDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(orderDate);
    endOfDay.setHours(23, 59, 59, 999);
    subFilter.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay,
    };
  }

  try {
    const standardOrders = await ordersModel
      .find(filter)
      .populate({
        path: "appliedDiscount",
        model: DiscountModel,
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    const mappedStandardOrders = standardOrders.map((order: any) => {
      const obj = order.toObject ? order.toObject() : order;
      return {
        ...obj,
        paymentID: obj.orderID || "",
      };
    });

    const subscriptions = await subscriptionsModel
      .find(subFilter)
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
      .sort({ createdAt: -1 });

    const groupedSubs: { [paymentID: string]: any[] } = {};
    subscriptions.forEach((sub) => {
      const pId = sub.paymentID || sub._id.toString();
      if (!groupedSubs[pId]) {
        groupedSubs[pId] = [];
      }
      groupedSubs[pId].push(sub);
    });

    const subOrders = Object.values(groupedSubs).map((group) => formatSubsAsOrder(group));

    const allCombined = [...mappedStandardOrders, ...subOrders];
    allCombined.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const totalOrders = allCombined.length;
    const paginated = allCombined.slice(skip, skip + limit);

    return NextResponse.json(
      {
        data: paginated,
        total: totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
