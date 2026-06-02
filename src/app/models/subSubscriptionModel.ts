import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubSubscription extends Document {
  _id: string;
  parentSubscription: Types.ObjectId;
  role: "groom" | "bridesmaids";
  inviteeEmail: string;
  inviteeUser?: Types.ObjectId;
  status: "pending" | "accepted" | "revoked";
  inviteMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubSubscriptionSchema = new Schema<ISubSubscription>(
  {
    parentSubscription: {
      type: Schema.Types.ObjectId,
      ref: "subscriptions",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["groom", "bridesmaids"],
      required: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      index: true,
    },
    inviteeUser: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    inviteMessage: { type: String, required: false },
  },
  { timestamps: true }
);

// Create and export the SubSubscription model
const SubSubscriptionModel =
  mongoose.models.subSubscriptions ||
  mongoose.model<ISubSubscription>("subSubscriptions", SubSubscriptionSchema);

export default SubSubscriptionModel;
