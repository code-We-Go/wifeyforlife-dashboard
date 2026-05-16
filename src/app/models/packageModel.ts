import mongoose, { Schema, Document } from "mongoose";
import { Ipackage, PackageCard, PackageItem, SupportCard } from "@/interfaces/interfaces";

// Define the Package Card schema
const PackageCardSchema = new Schema<PackageCard>({
  image: { type: String, required: true },
  points: { type: [String], required: true },
});

const SupportCardSchema = new Schema<SupportCard>({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: [String], required: true },
  imagePath: { type: String, required: true },
});

// Define the Package schema
const PackageSchema = new Schema(
  {
    name: { type: String, required: true },
    imgUrl: { type: String, required: true },
    images: { type: [String], required: false, default: [] },
    mobMainImage: { type: String, required: false },
    mobImages: { type: [String], required: false, default: [] },
    price: { type: Number, required: true, min: 0 },
    saving: { type: String, required: false },
    cost: { type: Number, required: false },
    duration: { type: Number, required: true },
    variants: {
      type: [
        {
          price: { type: Number, required: true },
          duration: { type: Number, required: true },
          saving: { type: String, required: false },
        },
      ],
      required: false,
      default: [],
    },
    renewals: {
      type: [
        {
          price: { type: Number, required: true },
          duration: { type: Number, required: true },
        },
      ],
      required: false,
      default: [],
    },
    items: {
      type: [{ value: String, included: Boolean }],
      required: true,
      default: [],
    },
    notes: { type: [String], required: true, default: [] },

    cards: { type: [PackageCardSchema], required: false, default: [] },
    supportCards: { type: [SupportCardSchema], required: false, default: [] },
    packagePlaylists: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "playlists" }],
      default: [],
    },
    accessAllPlaylists: { type: Boolean, default: false },
    packageInspos: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inspo" }],
      default: [],
    },
    accessAllInspos: { type: Boolean, default: false },
    packagePartners: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Partner" }],
      default: [],
    },
    accessAllPartners: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create and export the Package model
const packageModel =
  mongoose.models.packages ||
  mongoose.model<Ipackage>("packages", PackageSchema);

export default packageModel;
