import mongoose, { Schema, Document } from "mongoose";

export interface IPartnerSession extends Document {
  title: string;
  description: string;
  partnerName: string;
  price: number;
  sessionType: "one-to-one" | "webinar";
  // discountCode?: string;
  whatsappNumber: string;
  partnerEmail: string;
  subscriptionDiscountPercentage: number;
  profitPercentage: number;
  imageUrl: string;
  isActive: boolean;
}

const PartnerSessionSchema = new Schema<IPartnerSession>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    partnerName: { type: String, required: true },
    sessionType: {
      type: String,
      required: false,
      enum: ["one-to-one", "webinar"],
    },
    price: { type: Number, required: true, min: 0 },
    // discountCode: { type: String, required: false, default: "" },
    whatsappNumber: { type: String, required: true },
    subscriptionDiscountPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },
    partnerEmail: { type: String, required: true },
    profitPercentage: { type: Number, required: true, min: 0, max: 100 },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PartnerSessionSchema.index({ isActive: 1 });
PartnerSessionSchema.index({ partnerName: 1 });

const PartnerSessionModel =
  mongoose.models.PartnerSession ||
  mongoose.model<IPartnerSession>("PartnerSession", PartnerSessionSchema);

export default PartnerSessionModel;
