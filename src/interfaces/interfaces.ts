import { Discount } from "@/types/discount";
import mongoose from "mongoose";
export interface PackageCard {
  image: string;
  points: string[];
}

export interface SupportCard {
  id: number;
  title: string;
  description: string[];
  imagePath: string;
}

export interface PackageItem {
  value: string;
  included: boolean;
}

export interface Ipackage {
  name: string;
  imgUrl: string; // Main image (keeping for backward compatibility)
  images: string[]; // Array of image URLs
  price: number;
  duration: string;
  items: PackageItem[];
  notes: string[];
  cost?: string;
  cards: PackageCard[];
  supportCards: SupportCard[]; // Array of cards with image and points
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
}

// types/Playlist.ts
export interface SubPlaylist {
  _id?: string;
  title: string;
  videos: Video[] | string[]; // Can be full Video objects or just IDs
  thumbnailUrl: string;
  order: number;
}

export interface PlaylistItem {
  itemType: 'video' | 'subPlaylist';
  video?: Video | string; // Video object or ID
  subPlaylist?: SubPlaylist; // SubPlaylist object
  order: number;
}

export interface Playlist {
  _id?: string;
  title: string;
  description?: string[];
  items: PlaylistItem[]; // Changed from videos to items
  videos: (Video | string)[]; // Re-added to match current backend/frontend usage
  thumbnailUrl: string;
  isPublic: boolean;
  category?: string;
  tags?: string[];
  featured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  price?: number;
  name: string;
  attributeName: string;
  attributes: attribute[]; // e.g., [{ name: "Color", value: "Black" }, { name: "Capacity", value: "2L" }]
  images: media[];
}





export type attribute = {
  name: string;
  stock: number;
  price?: number;
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
  country?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string;
  postalZip?: string;
  city?: string;
  state?: string;
  phone?: string;
  cash?: string;
  cart?: CartItem[]; // Assuming CartItem interface exists
  subTotal?: number;
  shipping: number;
  appliedDiscount?: Discount;
  appliedDiscountAmount?: number;
  total?: number;
  currency?: string;
  status?: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  payment?: "pending" | "failed" | "confirmed";
  billingCountry?: string;
  billingFirstName?: string;
  billingState?: string;
  billingLastName?: string;
  billingAddress?: string;
  billingApartment?: string;
  billingPostalZip?: string;
  billingCity?: string;
  billingPhone?: string;
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
