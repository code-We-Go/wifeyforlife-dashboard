import mongoose from "mongoose";

export interface Variant {
  name: string;
  attributeName: string;
  attributes: attribute[]; // e.g., [{ name: "Color", value: "Black" }, { name: "Capacity", value: "2L" }]
  images: media[];
}

export interface Category {
  _id: string;
  categoryName: string;
  description: string;
  __v?: number; // optional if included in response
}

export interface SubCategory {
  _id: string;
  subCategoryName: string;
  description: string;
  categoryID: Category; // now a full object
  createdAt?: string;
  updatedAt?: string;
}

export type attribute = {
  name: string;
  stock: number;
};
export type media = {
  url: string;
  type: mediaType;
};
export type mediaType = "image" | "video";

export type price = {
  local: number;
  global:number;
};
export interface Category {
  _id: string;
  categoryName: string;
  description: string;
  imageURL: string;
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
  categoryID: Category; // now a full object
  createdAt?: string;
  updatedAt?: string;
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
  cash?: boolean;
  cart?: CartItem[]; // Assuming CartItem interface exists
  subTotal?: number;
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
  zone_rate: number;
}
