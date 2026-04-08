import mongoose, { Schema, Document } from "mongoose";

export interface IRecipient {
  userId: mongoose.Types.ObjectId;
  seen: boolean;
  seenAt?: Date;
}

export interface INotification extends Document {
  title: string;
  body: string;
  link?: string;
  targetType: "all" | "specific";
  recipients: IRecipient[];
  deliveryStats: {
    requested: number;
    delivered: number;
    failed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RecipientSchema = new Schema<IRecipient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
      required: false,
    },
  },
  { _id: false },
);

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: false,
    },
    targetType: {
      type: String,
      enum: ["all", "specific"],
      required: true,
    },
    recipients: {
      type: [RecipientSchema],
      default: [],
    },
    deliveryStats: {
      requested: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Index for mobile app: "get my unseen notifications"
NotificationSchema.index({ "recipients.userId": 1, "recipients.seen": 1 });
// Index for admin dashboard: latest notifications first
NotificationSchema.index({ createdAt: -1 });
// TTL: auto-expire after 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

const NotificationModel =
  mongoose.models.notifications ||
  mongoose.model<INotification>("notifications", NotificationSchema);

export default NotificationModel;
