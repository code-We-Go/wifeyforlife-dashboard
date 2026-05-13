import mongoose, { Schema, Document } from "mongoose";
import { object } from "zod";
import { CartItemSchema } from "./cartItemSchema";

// Define the Order schema

const OrderSchema = new Schema(
    { email:{type: String, required: false},
    orderID:{type:String , required : false}
        ,country: { type: String, required: false },
        firstName: { type: String, required: false },
        lastName: { type: String, required: false },
        address: { type: String, required: false },
        apartment: { type: String,required: false },
        postalZip: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        phone: { type: String, required: false },
        // Gift info
        isGift: { type: Boolean, default: false },
        giftRecipientEmail: { type: String, required: false },
        specialMessage: { type: String, required: false },
        giftCardName: { type: String, required: false },
        cash: { type: String, required: false, enum: ["card", "cash", "instapay"] }, // Payment method: card, cash, or instapay
        cart: {
            type: [CartItemSchema],required:false // Array of cart items
        },
        redeemedLoyaltyPoints:{type:Number,required:false},
        appliedDiscount:{type:mongoose.Schema.Types.ObjectId,required:false,ref:'discounts'},
        appliedDiscountAmount:{type:Number,required:false},
        subTotal: { type: Number, required: false}, 
        shipping: { type: Number, required: false}, 
        total: { type: Number, required: false}, 
        currency: { type: String, required: false}, 
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
            default: "pending",
        },
        payment:{
            type: String,
            enum: ["pending","failed" ,"confirmed"],
            default: "pending",
        },
        expiryDate:{type:Date,required:false},
        shipmentID: { type: String, required: false ,default:""}, // Bosta shipment ID
        billingCountry:{ type: String, required: false },
        billingFirstName: { type: String, required: false },
        billingState:{ type: String, required: false },
        billingLastName:  { type: String, required: false },
        billingAddress:  { type: String, required: false },
        billingApartment:{ type: String, required: false },
        billingPostalZip:{ type: String, required: false },
        billingCity:{ type: String, required: false },
        billingPhone:{ type: String, required: false },
        bostaCity: { type: String, required: false },
        bostaCityName: { type: String, required: false },
        bostaZone: { type: String, required: false },
        bostaZoneName: { type: String, required: false },
        bostaDistrict: { type: String, required: false },
        bostaDistrictName: { type: String, required: false },
        isMob: { type: Boolean, default: false },
        instapayReciept: { type: String, required: false },
        createdAt: { type: Date, default: Date.now },
            expiresAt: { type: Date, required: false },

    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Define the Order model
const ordersModel = mongoose.models.orders || mongoose.model<Document & mongoose.Model<any>>("orders", OrderSchema);

export default ordersModel;
