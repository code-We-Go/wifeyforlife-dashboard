import { Discount } from "@/types/discount";
import mongoose, { Types } from "mongoose";

export interface IAccountFeature {
  _id?: mongoose.Types.ObjectId;
  featureKey: string;
  label: string;
  accessType: "free" | "subscription";
  requiredPackages: Types.ObjectId[];
}

export interface PackageVariant {
  price: number;
  duration: number;
  saving?: string;
  translations?: {
    ar?: {
      saving?: string;
    };
  };
}

export interface PackageRenewal {
  price: number;
  duration: number;
}

export interface PackageCard {
  image: string;
  points: string[];
  translations?: {
    ar?: {
      points?: string[];
    };
  };
}

export interface SupportCard {
  id: number;
  title: string;
  description: string[];
  imagePath: string;
  enable?: boolean;
  translations?: {
    ar?: {
      title?: string;
      description?: string[];
    };
  };
}

export interface SubSubscriptionSlot {
  role: "groom" | "bridesmaids";
  maxCount: number;
}

export interface ComparisonFeature {
  feature: string;
  fullValue: string;
  miniValue: string;
  translations?: {
    ar?: {
      feature?: string;
      fullValue?: string;
      miniValue?: string;
    };
  };
}

export interface PackageItem {
  value: string;
  included: boolean;
  translations?: {
    ar?: {
      value?: string;
    };
  };
}

export interface Ipackage {
  slug?: string;
  name: string;
  imgUrl: string; // Main image (keeping for backward compatibility)
  images: string[]; // Array of image URLs
  arabicImgUrl?: string;
  arabicImages?: string[];
  enableArabicEdition?: boolean;
  mobMainImage?: string;
  mobImages?: string[];
  price: number;
  discountedFrom?: number;
  duration: number;
  saving?: string;
  variants?: PackageVariant[];
  renewals?: PackageRenewal[];
  items: PackageItem[];
  notes: string[];
  cost?: number;
  cards: PackageCard[];
  supportCards: SupportCard[]; // Array of cards with image and points
  packagePlaylists: string[];
  accessAllPlaylists: boolean;
  packageInspos: string[];
  accessAllInspos: boolean;
  packagePartners: string[];
  accessAllPartners: boolean;
  packageProducts?: string[];
  subSubscriptionSlots?: SubSubscriptionSlot[];
  badgeLabel?: string;
  calloutBadge?: string;
  calloutTitle?: string;
  calloutDescription?: string;
  comparisonFeatures?: ComparisonFeature[];
  partOf?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  translations?: {
    ar?: {
      name?: string;
      partOf?: string;
      saving?: string;
      notes?: string[];
      badgeLabel?: string;
      calloutBadge?: string;
      calloutTitle?: string;
      calloutDescription?: string;
      heroTitle?: string;
      heroSubtitle?: string;
      imgUrl?: string;
      images?: string[];
    };
  };
}
// types/Video.ts
export interface CommentUser {
  _id?: string;
  username: string;
  firstName: string;
  lastName: string;
  imageURL?: string;
}

export interface VideoReply {
  _id: string;
  userId: CommentUser;
  username: string; // Kept for backward compatibility
  text: string;
  firstName?: string;
  lastName?: string;
  userImage?: string;
  likes?: (CommentUser | string)[]; // Array of users or user IDs who liked this reply
  createdAt: Date;
}

export interface VideoComment {
  _id?: string;
  userId: CommentUser;
  username: string; // Kept for backward compatibility
  text: string;
  firstName?: string;
  lastName?: string;
  userImage?: string;
  likes?: (CommentUser | string)[]; // Array of users or user IDs who liked this comment
  replies?: VideoReply[]; // Array of replies to this comment
  createdAt: Date;
}

export interface Video {
  _id?: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  isPublic: boolean;
  likes?: (CommentUser | string)[]; // Array of users or user IDs who liked the video
  comments?: VideoComment[]; // Array of comments
  createdAt: Date;
  updatedAt: Date;
  playlistHint?: string;
  playlistFolder?: string; // slug of the folder this video belongs to within its playlist
  tags?: string[];
  translations?: {
    ar?: {
      title?: string;
      description?: string;
    };
  };
}

// types/Playlist.ts

/** A folder inside a playlist — has a display name and a URL-safe slug */
export interface PlaylistFolder {
  _id?: string;
  name: string;   // e.g. "Behind the Scenes"
  slug: string;   // e.g. "behind-the-scenes"
  translations?: {
    ar?: {
      name?: string;
    };
  };
}

export interface SubPlaylist {
  _id?: string;
  title: string;
  videos: Video[] | string[];
  thumbnailUrl: string;
  order: number;
}

export interface PlaylistItem {
  itemType: 'video' | 'subPlaylist';
  video?: Video | string;
  subPlaylist?: SubPlaylist;
  order: number;
}

export const PLAYLIST_CATEGORIES = [
  "Gehaz Bestie Experience",
  "Wedding Planning Experience"
] as const;

export interface Playlist {
  _id?: string;
  title: string;
  description?: string[];
  folders: PlaylistFolder[];          // ordered list of folders
  videos: (Video | string)[];            // videos array of string IDs or populated objects
  items: PlaylistItem[];              // legacy / alternative structure
  thumbnailUrl: string;
  isPublic: boolean;
  category?: string;
  tags?: string[];
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations?: {
    ar?: {
      title?: string;
      description?: string[];
      category?: string;
    };
  };
}

export interface Variant {
  price?: number;
  name: string;
  attributeName: string;
  attributes: attribute[]; // e.g., [{ name: "Color", value: "Black" }, { name: "Capacity", value: "2L" }]
  images: media[];
  mobImages?: media[];
  translations?: {
    ar?: {
      name?: string;
      attributeName?: string;
    };
  };
}





export type attribute = {
  name: string;
  stock: number;
  price?: number;
  translations?: {
    ar?: {
      name?: string;
    };
  };
};
export type media = {
  url: string;
  type: mediaType;
};
export type mediaType = "image" | "video";

export type price = {
  local: number;
  global: number;
};
export interface Category {
  _id: string;
  categoryName: string;
  description: string;
  image?: string;
  HomePage?: boolean;
  imageURL?: string; // @deprecated use image
  __v?: number;
  active?: boolean;
  type?: "wedding-planning" | "product";
  translations?: {
    ar?: {
      categoryName?: string;
      description?: string;
    };
  };
}
export interface Collection {
  _id: string;
  collectionName: string;
  description: string;
  imageURL: string;
  products?: string[];
}
export interface SubCategory {
  _id: string;
  subCategoryName: string;
  description: string;
  image?: string;
  HomePage?: boolean;
  categoryID: Category; // now a full object
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  translations?: {
    ar?: {
      subCategoryName?: string;
      description?: string;
    };
  };
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: price;
  comparedPrice: number;
  // subCategoryID: mongoose.Types.ObjectId;
  subCategoryID: SubCategory; // now a full object
  variations: Variant[];
  productDimensions: string[];
  productDetails: string[];
  productCare: string[];
  season: string;
  featured: boolean;
  ratings: number;
  order?: number;
  translations?: {
    ar?: {
      title?: string;
      description?: string;
      productDimensions?: string[];
      productDetails?: string[];
      productCare?: string[];
      season?: string;
    };
  };
}

export type AddProductType = Omit<Product, "_id">;

export interface Newsletters {
  email: string;
  _id: string;
}

export interface ImageVariant {
  image: string;
  color: string;
}
export interface Size {
  //   type:string;
  name: string;
  stock: number;
}
export interface CartItem {
  productId: string;
  productName: string;
  price: number;
  attributes: attribute;
  variant: Variant;
  quantity: number;
  imageUrl: string;
  collections?: string[];
  originalPrice?: number;
  edition?: "ar" | "en";
  editionName?: string;
}

export type FeaturedProduct = Omit<CartItem, "id" | "quantity">;

//   export interface FeaturedProduct
//   {
//    productId: string,
//    productName: string,
//    price: number,
//    imageUrl: string,
//    color:string
//   }
export interface User {
  email: string;
  userId: string;
  userCountry: string;
  firstName: string;
  lastName: string;
  title: string;
  phoneNumber: string;
  address: string;
  deviceType: string;
  // phoneCode:string;
  dob: string;
  points?: number;
}
export interface IOrder {
  _id: string;
  email: string;
  orderID?: string;
  paymentID?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string;
  postalZip?: string;
  city?: string;
  state?: string;
  phone?: string;
  cash?: "card" | "cash" | "instapay";
  cart?: CartItem[]; // Assuming CartItem interface exists
  subTotal?: number;
  shipping: number;
  appliedDiscount?: Discount;
  appliedDiscountAmount?: number;
  redeemedLoyaltyPoints?: number;
  total?: number;
  currency?: string;
  status?: "order_created" | "picked_up" | "in_progress" | "out_for_delivery" | "delivered" | "cancelled" | "returned" | "exception" | "investigation" | "awaiting_action" | "on_hold" | "pending" | "confirmed" | "shipped" | "failed";
  payment?: "pending" | "failed" | "confirmed";
  specialMessage?: string;
  giftCardName?: string;
  isGift?: boolean;
  giftRecipientEmail?: string;
  billingCountry?: string;
  billingFirstName?: string;
  billingState?: string;
  billingLastName?: string;
  billingAddress?: string;
  billingApartment?: string;
  billingPostalZip?: string;
  billingCity?: string;
  billingPhone?: string;
  billingEmail?: string;
  instapayReciept?: string;
  edition?: "ar" | "en";
  editionName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ShippingZone {
  _id: string;
  zone_name: string;
  zone_rate: {
    local: number;
    global: number;
  };
  localGlobal: "local" | "global";
  states?: string[];
  countries?: string[];
}

export interface ILoyaltyTransaction {
  _id?: string;
  userId: string; // or mongoose.Types.ObjectId
  type: "earn" | "spend";
  reason: string;
  amount: number;
  timestamp: Date;
  bonusID?: ILoyaltyBonus;
}

export interface ILoyaltyBonus {
  _id?: string;
  title: string;
  description: string;
  bonusPoints: number;
  active: boolean;
}

export interface InspoSection {
  _id?: string;
  title: string;
  viewCount?: number;
  images: {
    public_id: string;
    downloadCount: number;
    favoriteCount?: number;
  }[];
}

export interface Inspo {
  _id: string;
  title: string;
  viewCount?: number;
  sections: InspoSection[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Partner {
  _id?: string;
  category: string;
  subCategory: string;
  brand: string;
  offer: string;
  discount: string;
  code: string;
  link: string;
  bookingMethod: string;
  imagePath: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WeddingPlanningVendor {
  _id: string;
  name: string;
  fromPrice?: number;
  toPrice?: number;
  link?: string[];
  images?: string[];
  coverImage?: string;
  package?: string;
  notes?: string;
  subCategoryID: SubCategory[];
  active?: boolean;
  request?: boolean;
  requestStatus?: "Pending" | "Approved" | "Rejected" | "Archived";
  visitedCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
