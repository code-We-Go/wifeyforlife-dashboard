import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPartnerSessionOrder extends Document {
  sessionId: Types.ObjectId;
  sessionTitle: string;
  partnerName: string;
  partnerEmail: string;
  whatsappNumber: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  appliedDiscountCode?: string;
  basePrice: number;
  finalPrice: number;
  subscriptionDiscountAmount: number;
  profitPercentage: number;
  ourProfitAmount: number;
  paymentID?: string;
  status: "pending" | "paid" | "failed" | "cancelled";
}

const PartnerSessionOrderSchema = new Schema<IPartnerSessionOrder>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "PartnerSession",
      required: true,
    },
    sessionTitle: { type: String, required: true },
    partnerName: { type: String, required: true },
    partnerEmail: { type: String, required: true },
    whatsappNumber: { type: String, required: true },
    clientFirstName: { type: String, required: true },
    clientLastName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    appliedDiscountCode: { type: String },
    basePrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    subscriptionDiscountAmount: { type: Number, default: 0 },
    profitPercentage: { type: Number, required: true, min: 0, max: 100 },
    ourProfitAmount: { type: Number, required: true },
    paymentID: { type: String },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

PartnerSessionOrderSchema.index({ clientEmail: 1, status: 1 });

const PartnerSessionOrderModel =
  mongoose.models.PartnerSessionOrder ||
  mongoose.model<IPartnerSessionOrder>(
    "PartnerSessionOrder",
    PartnerSessionOrderSchema
  );

export default PartnerSessionOrderModel;
