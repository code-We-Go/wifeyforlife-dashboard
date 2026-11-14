import mongoose, { Schema, Document } from "mongoose";
import { Ipackage, PackageCard, PackageItem, SupportCard } from "@/interfaces/interfaces";

// Define the Package Card schema
const PackageCardSchema = new Schema<PackageCard>({
  image: { type: String, required: true },
  points: { type: [String], required: true },
  translations: {
    ar: {
      points: { type: [String], required: false },
    },
  },
});

const SupportCardSchema = new Schema<SupportCard>({
  id: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: [String], required: true },
  imagePath: { type: String, required: true },
  enable: { type: Boolean, default: true },
  translations: {
    ar: {
      title: { type: String, required: false },
      description: { type: [String], required: false },
    },
  },
});

// Define the Package schema
const PackageSchema = new Schema(
  {
    name: { type: String, required: true },
    imgUrl: { type: String, required: true },
    images: { type: [String], required: false, default: [] },
    arabicImgUrl: { type: String, required: false },
    arabicImages: { type: [String], required: false, default: [] },
    enableArabicEdition: { type: Boolean, required: false },
    mobMainImage: { type: String, required: false },
    mobImages: { type: [String], required: false, default: [] },
    price: { type: Number, required: true, min: 0 },
    discountedFrom: { type: Number, required: false },
    saving: { type: String, required: false },
    cost: { type: Number, required: false },
    duration: { type: Number, required: true },
    variants: {
      type: [
        {
          price: { type: Number, required: true },
          discountedFrom: { type: Number, required: false },
          duration: { type: Number, required: true },
          saving: { type: String, required: false },
          translations: {
            ar: {
              price: { type: Number, required: false, min: 0 },
              discountedFrom: { type: Number, required: false, min: 0 },
              saving: { type: String, required: false },
            },
          },
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
      type: [
        {
          value: { type: String, required: true },
          included: { type: Boolean, required: true },
          translations: {
            ar: {
              value: { type: String, required: false },
            },
          },
        },
      ],
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
    packageProducts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "products" }],
      default: [],
    },
        subSubscriptionSlots: {
      type: [
        {
          role: { type: String, enum: ["groom", "bridesmaids"], required: true },
          maxCount: { type: Number, required: true, default: 1 },
        },
      ],
      default: [],
    },
    comparisonFeatures: {
      type: [
        {
          feature: { type: String, required: true },
          fullValue: { type: String, required: true },
          miniValue: { type: String, required: true },
          translations: {
            ar: {
              feature: { type: String, required: false },
              fullValue: { type: String, required: false },
              miniValue: { type: String, required: false },
            },
          },
        },
      ],
      required: false,
      default: [],
    },
    badgeLabel: { type: String, required: false },
    calloutBadge: { type: String, required: false },
    calloutTitle: { type: String, required: false },
    calloutDescription: { type: String, required: false },
    translations: {
      ar: {
        name: { type: String, required: false },
        price: { type: Number, required: false, min: 0 },
        discountedFrom: { type: Number, required: false, min: 0 },
        partOf: { type: String, required: false },
        saving: { type: String, required: false },
        notes: { type: [String], required: false },
        badgeLabel: { type: String, required: false },
        calloutBadge: { type: String, required: false },
        calloutTitle: { type: String, required: false },
        calloutDescription: { type: String, required: false },
        heroTitle: { type: String, required: false },
        heroSubtitle: { type: String, required: false },
        imgUrl: { type: String, required: false },
        images: { type: [String], required: false, default: [] },
      },
    },
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
