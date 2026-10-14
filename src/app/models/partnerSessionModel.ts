import mongoose, { Schema, Document } from "mongoose";

export interface IPartnerSessionVariant {
  title: string;
  description: string;
  price: number;
  duration: number;
}

export interface IPartnerSessionBooking {
  _id?: string;
  orderId?: string;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  variantTitle?: string;
  bookedAt?: Date;
  status?: string;
}

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
  order?: number;
  featured?: boolean;
  maxCapacity?: number;
  bookings?: IPartnerSessionBooking[];
  variants?: IPartnerSessionVariant[];
  meetingLink?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const PartnerSessionVariantSchema = new Schema<IPartnerSessionVariant>(
  {
    title: { type: String, required: true },
    description: { type: String, required: false, default: "" },
    price: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PartnerSessionBookingSchema = new Schema<IPartnerSessionBooking>(
  {
    orderId: { type: String, required: false },
    clientFirstName: { type: String, required: true },
    clientLastName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    clientPhone: { type: String, required: true },
    variantTitle: { type: String, required: false },
    bookedAt: { type: Date, default: Date.now },
    status: { type: String, default: "paid" },
  },
  { _id: true }
);

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
    order: { type: Number, required: false, default: 0 },
    featured: { type: Boolean, default: false },
    maxCapacity: { type: Number, required: false, default: 0 },
    bookings: { type: [PartnerSessionBookingSchema], default: [] },
    variants: { type: [PartnerSessionVariantSchema], default: [] },
    meetingLink: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

PartnerSessionSchema.index({ isActive: 1 });
PartnerSessionSchema.index({ partnerName: 1 });
PartnerSessionSchema.index({ order: 1 });
PartnerSessionSchema.index({ featured: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.PartnerSession) {
  delete (mongoose.models as any).PartnerSession;
}

const PartnerSessionModel =
  mongoose.models.PartnerSession ||
  mongoose.model<IPartnerSession>("PartnerSession", PartnerSessionSchema);

export default PartnerSessionModel;
