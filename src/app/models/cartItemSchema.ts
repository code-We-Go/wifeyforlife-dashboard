import { Schema } from "mongoose";

export const attributeSchema = new Schema({
    name: { type: String, required: true },
    stock: { type: Number, required: true },
  }, { _id: false });
  
export const mediaSchema = new Schema({
    url: { type: String, required: true },
    type: { type: String, default: 'image' }, 
  }, { _id: false });
  
export const variantSchema = new Schema({
    name: { type: String, required: true },
    attributeName: { type: String, required: true },
    attributes: { type: [attributeSchema], required: true },
    images: { type: [mediaSchema], default: [] },
  }, { _id: false });
  
export const CartItemSchema = new Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    attributes: { type: attributeSchema, required: false },
    variant: { type: variantSchema, required: false },
    collections: [{ type: String }], 
  });
