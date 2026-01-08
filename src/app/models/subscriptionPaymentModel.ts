import mongoose, { Schema, Document } from "mongoose";

// Subscription Payment schema mirrors Subscription fields + from/to/process
const SubscriptionPaymentSchema = new Schema(
  {
    // Core payment and context
    paymentID: { type: String, required: true },
    email: { type: String, required: true },
    userID: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: false },
    process: { type: String, enum: ["upgrade", "renew", "new"], required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "packages", required: false },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "packages", required: true },

    // Subscription model parity fields
    packageID: { type: mongoose.Schema.Types.ObjectId, ref: "packages" }, // optional mirror, will be set to `to`
    subscribed: { type: Boolean, default: false },
    redeemedLoyaltyPoints: { type: Number, required: false },
    appliedDiscount: { type: mongoose.Schema.Types.ObjectId, ref: "discounts", required: false },
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
    shipping: { type: Number, required: false },
    currency: { type: String, required: false },
    expiryDate: { type: Date, required: false },

    // Bosta fields
    bostaCity: { type: String, required: false },
    bostaCityName: { type: String, required: false },
    bostaZone: { type: String, required: false },
    bostaZoneName: { type: String, required: false },
    bostaDistrict: { type: String, required: false },
    bostaDistrictName: { type: String, required: false },
    shipmentID: { type: String, required: false, default: "" },

    // Status tracking
    status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const subscriptionPaymentModel =
  mongoose.models.subscriptionPayments ||
  mongoose.model<Document & mongoose.Model<any>>(
    "subscriptionPayments",
    SubscriptionPaymentSchema
  );

export default subscriptionPaymentModel;