import mongoose, { Schema, Document } from "mongoose";
import { CartItemSchema } from "./cartItemSchema";

// Define the Subscription schema with TTL
const SubscriptionSchema = new Schema(
  {
    cart: {
      type: [CartItemSchema],
      default: [],
    },
    paymentID: {
      type: String,
      required: true,
    },
    packageID: { type: mongoose.Schema.Types.ObjectId, ref: "packages" },
    selectedDuration: { type: Number, required: false },
    email: { type: String },

    subscribed: { type: Boolean, default: false },
    redeemedLoyaltyPoints: { type: Number, required: false },
    appliedDiscount: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "discounts",
    },
    
    appliedDiscountAmount: { type: Number, required: false },
    // User information
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    whatsAppNumber: { type: String, required: false },
    // Gift information
    isGift: { type: Boolean, default: false },
    giftRecipientEmail: { type: String, required: false },
    specialMessage: { type: String, required: false },
    giftCardName: { type: String, required: false },
    // Lovely Bride's address information
    country: { type: String, required: false },
    address: { type: String, required: false },
    apartment: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    postalZip: { type: String, required: false },
    // Billing information
    billingCountry: { type: String, required: false },
    billingFirstName: { type: String, required: false },
    billingLastName: { type: String, required: false },
    billingState: { type: String, required: false },
    billingAddress: { type: String, required: false },
    billingApartment: { type: String, required: false },
    billingPostalZip: { type: String, required: false },
    billingCity: { type: String, required: false },
    billingPhone: { type: String, required: false },
    // Payment information
    total: { type: Number, required: false },
    subTotal: { type: Number, required: false },
    cost: { type: Number, required: false }, // Package cost at time of subscription
    shipping: { type: Number, required: false },
    currency: { type: String, required: false },
    expiryDate: { type: Date, default: Date.now },

    allowedPlaylists: {
      type: [
        {
          playlistID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "playlists",
            required: true,
          },
          expiryDate: { type: Date, required: true },
        },
      ],
      default: [],
    },
    miniSubscriptionActivated:{
      type: Boolean,
      required: false,
    },
    bostaCity: { type: String, required: false },
    bostaCityName: { type: String, required: false },
    bostaZone: { type: String, required: false },
    bostaZoneName: { type: String, required: false },
    bostaDistrict: { type: String, required: false },
    bostaDistrictName: { type: String, required: false },
    shipmentID: { type: String, required: false, default: "" }, // Bosta shipment ID
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
        paymentMethod: { type: String, required: false,enum:["instapay","cash","card"] },

    // process: {
    //   type: String,
    //   enum: ["new", "upgrade", "renew"],
    //   default: "new",
    // },
    instapayReciept: { type: String, required: false },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Define the Subscription model
const subscriptionsModel =
  mongoose.models.subscriptions ||
  mongoose.model<Document & mongoose.Model<any>>(
    "subscriptions",
    SubscriptionSchema
  );

export default subscriptionsModel;
