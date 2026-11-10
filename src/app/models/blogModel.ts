import mongoose, { Schema, Document } from "mongoose";

// Define block-based content types
export type BlockLayout = "img-left" | "img-block";

export interface IContentBlock {
  type: "text" | "image" | "imageText" | "carousel" | "embed";
  textHtml?: string;
  imageUrl?: string;
  url?: string; // For embed (TikTok, Instagram, YouTube)
  caption?: string;
  alt?: string;
  layout?: BlockLayout; // img-left = image beside text, img-block = image above text
  arabicContent?: string; // Optional field for Arabic content
  images?: { imageUrl: string; alt?: string; caption?: string }[];
}

export interface IContentImage {
  imageUrl?: string;
  alt?: string;
  caption?: string;
}

const ContentImageSchema = new Schema(
  {
    imageUrl: { type: String },
    alt: { type: String },
    caption: { type: String },
  } as any,
  { _id: false }
);

const ContentBlockSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["text", "image", "imageText", "carousel", "embed"],
      required: true,
    },
    textHtml: { type: String },
    imageUrl: { type: String },
    url: { type: String },
    caption: { type: String },
    arabicContent: { type: String },
    alt: { type: String },
    images: { type: [ContentImageSchema] },
    layout: {
      type: String,
      enum: ["img-left", "img-block"],
      default: "img-block",
    },
  } as any,
  { _id: false }
);

export interface IBlogV2 {
  titleAR?: string;
  excerptAR?: string;
  blocks?: IContentBlock[];
}

const BlogV2Schema = new Schema(
  {
    titleAR: { type: String, trim: true },
    excerptAR: { type: String },
    blocks: [ContentBlockSchema],
  },
  { _id: false }
);

// Define the Blog interface
export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string; // Rich text content (HTML) - mobile app reads this
  excerpt: string;
  featuredImage?: string;
  tikTokVideoUrl?: string;
  author: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  tags: string[];
  categories: string[];
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
  viewCount: number;
  mobileViewCount: number;
  webViewCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: {
    ar?: {
      title?: string;
      excerpt?: string;
      content?: string;
    };
  };
  // New V2 namespace - completely separate from legacy mobile app fields
  v2?: IBlogV2;
  // Optional convenience accessors
  titleAR?: string;
  excerptAR?: string;
  blocks?: IContentBlock[];
}

// Define the Blog schema
const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: false,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9\s-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    content: {
      type: String,
      required: false,
      default: "",
    },
    excerpt: {
      type: String,
      required: false,
    },
    v2: {
      type: BlogV2Schema,
      default: () => ({}),
    },
    featuredImage: {
      type: String,
      required: false,
    },
    tikTokVideoUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty values
          // Validate TikTok URL format
          return /^https:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/.test(v) ||
            /^https:\/\/vm\.tiktok\.com\/[\w]+/.test(v);
        },
        message: "Please enter a valid TikTok video URL",
      },
    },
    // author: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "users",
    //   required: true
    // },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: false,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 30;
        },
        message: "Maximum 30 tags allowed",
      },
    },
    categories: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 15;
        },
        message: "Maximum 15 categories allowed",
      },
    },
    metaTitle: {
      type: String,
    },
    metaDescription: {
      type: String,
    },
    publishedAt: {
      type: Date,
      required: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mobileViewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    webViewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    translations: {
      ar: {
        title: { type: String, required: false },
        excerpt: { type: String, required: false },
        content: { type: String, required: false },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: false,
  },
);

// Create indexes for better performance
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ categories: 1 });
BlogSchema.index({ featured: 1, status: 1 });

// Pre-save middleware to auto-generate slug if not provided
BlogSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

// Virtual for reading time estimation (assuming 200 words per minute)
BlogSchema.virtual("readingTime").get(function () {
  let text = "";
  const blocks = (this as any).v2?.blocks || (this as any).blocks;
  if (Array.isArray(blocks) && blocks.length > 0) {
    text = blocks
      .map((b: IContentBlock) => (b.textHtml ? b.textHtml : ""))
      .join(" ");
  } else if (this.content && typeof this.content === "string") {
    text = this.content;
  }
  const wordCount = text
    .replace(/<[^>]*>/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  return readingTime;
});

// Virtual for formatted publish date
BlogSchema.virtual("formattedPublishDate").get(function () {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return null;
});

// Create and export the Blog model
const BlogModel =
  mongoose.models.blogs || mongoose.model<IBlog>("blogs", BlogSchema);

export default BlogModel;
