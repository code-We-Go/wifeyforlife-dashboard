import mongoose, { Schema, Document, Types } from "mongoose";
import { IAccountFeature } from "@/interfaces/interfaces";

const AccountFeatureSchema = new Schema<IAccountFeature>(
  {
    featureKey: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    accessType: { type: String, enum: ["free", "subscription"], default: "free" },
    requiredPackages: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "packages" }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const accountFeatureModel =
  mongoose.models.accountFeatures ||
  mongoose.model<IAccountFeature>("accountFeatures", AccountFeatureSchema);

export default accountFeatureModel;
