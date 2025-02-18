import mongoose, { Schema, Document } from "mongoose";

// Define the Cart Item schema
const CartItemSchema = new Schema({
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    color: { type: String, required: true },
    imageUrl: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
});

// Define the Order schema
const OrderSchema = new Schema(
    { email:{type: String, required: true}
        ,orderID:{type: String, required: false}
        ,country: { type: String, required: false },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        address: { type: String, required: false },
        apartment: { type: String,required: false },
        postalZip: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        phone: { type: String, required: false },
        cash: { type: String, required: false, default: false }, // Payment method: Cash or not
        cart: {
            type: [CartItemSchema],required:false // Array of cart items
        },
        total: { type: Number, required: false}, 
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
            default: "pending",
        },
        payment:{
            type: String,
            enum: ["pending","failed" ,"confirmed"],
            default: "pending",
        },
        billingCountry:{ type: String, required: false },
        billingFirstName: { type: String, required: false },
        billingState:{ type: String, required: false },
        billingLastName:  { type: String, required: false },
        billingAddress:  { type: String, required: false },
        billingApartment:{ type: String, required: false },
        billingPostalZip:{ type: String, required: false },
        billingCity:{ type: String, required: false },
        billingPhone:{ type: String, required: false },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Define the Order model
const ordersModel = mongoose.models.orders || mongoose.model<Document & mongoose.Model<any>>("orders", OrderSchema);

export default ordersModel;
