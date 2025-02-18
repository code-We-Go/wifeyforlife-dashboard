import { price } from './../../interfaces/interfaces';
import mongoose, { Schema, Document } from 'mongoose';

// Define the Variant interface
export interface Variant {
  color: string;
  images: string[];
  stock: number;
  featured: boolean;
}

// Define the Product interface
export interface Product extends Document {
  title: string;
  description: string;
  price:  {
    local: { type: Number, required: true },
    global: { type: Number, required: true },
  };
  productDimensions:{type:[String], required: false}
  productDetails:{type:[String], required: false}
  productCare:{type:[String], required: false}
  featured: boolean;
  variations: Variant[];
}

// Define the Variant schema
const VariantSchema = new Schema<Variant>({
  color: { type: String, required: true },
  images: { type: [String], required: true },
  featured: { type: Boolean, required: true, default: false },
  stock: { type: Number, required: true },
});

const priceSchema = new Schema<price>({
  local: { type: Number, required: true },
  global: { type: Number, required: true },
})

// Define the Product schema
const ProductSchema = new Schema<Product>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: {type:priceSchema,required:true
  },
  featured: { type: Boolean, required: true ,default: false},
  productDimensions:{type:[String], required: false},
  productDetails:{type:[String], required: false},
  productCare:{type:[String], required: false},
  
  variations: { type: [VariantSchema], required: false },
});

// Create and export the Product model
 const productModel = mongoose.models.products || mongoose.model<Product>('products', ProductSchema);
 export default productModel
