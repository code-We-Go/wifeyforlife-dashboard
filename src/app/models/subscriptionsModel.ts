import mongoose, { Schema, Document, Types } from "mongoose";

// Define the Subscription interface
export interface ISubscription extends Document {
  paymentID: string;
  packageID: Types.ObjectId;
  email?: string;
  subscribed: boolean;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date; // Because of timestamps: true
}

// Define the Subscription schema with TTL
const SubscriptionSchema = new Schema(
    {
        paymentID: { 
            type: String, 
            required: true 
        },
        packageID:{type:mongoose.Schema.Types.ObjectId,
            refer: "packages",
        },
        email:{type:String},
        subscribed:{type:Boolean,default:false},
        expiryDate:{type:Date,default:Date.now},
        createdAt: { 
            type: Date, 
            default: Date.now,// 30 minutes in seconds
        }
    },
    { timestamps: true }
);

// Define the Subscription model
const subscriptionsModel = mongoose.models.subscriptions ||
  mongoose.model<ISubscription>("subscriptions", SubscriptionSchema);

export default subscriptionsModel; 