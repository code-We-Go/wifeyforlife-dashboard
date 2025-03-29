import { Size } from '@/interfaces/interfaces';
import mongoose, { Schema, Document } from 'mongoose';

// Define the Variant interface
export interface Variant {
  color: string;
  images: string[];
  stock: number;
  sizes: Size[];
}

// Define the Product interface
export interface Product extends Document {
  title: string;
  description: string;
  collectionID: string;
  subCollectionID: string;
  price: {
    local: number;
  };
  productDimensions: string[];
  productDetails: string[];
  productCare: string[];
  variations: Variant[];
}
const sizeSchema=new Schema<Size>({
  name:{type:String,required:true},
  stock:{type:Number,required:true}
})
// Define the Variant schema
const VariantSchema = new Schema<Variant>({
  color: { type: String, required: true },
  sizes: { 
    type: [sizeSchema], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one size is required'
    }
  },
  images: { 
    type: [String], 
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length > 0;
      },
      message: 'At least one image is required'
    }
  },
});

// Define the Product schema
const ProductSchema = new Schema<Product>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  collectionID: { type: String, required: true },
  subCollectionID: { type: String, required: false },
  price: {
    local: { 
      type: Number, 
      required: true,
      min: 0 
    }
  },
  productDimensions: { type: [String], default: [] },
  productDetails: { type: [String], default: [] },
  productCare: { type: [String], default: [] },
  variations: { 
    type: [VariantSchema], 
    required: true,
    validate: {
      validator: function(v: Variant[]) {
        return v.length > 0;
      },
      message: 'At least one variation is required'
    }
  },
});

// Create and export the Product model
const productsModel = mongoose.models.products || mongoose.model<Product>('products', ProductSchema);
export default productsModel;