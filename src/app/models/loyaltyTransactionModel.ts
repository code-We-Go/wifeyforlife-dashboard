import mongoose, { Schema, Document } from "mongoose";

export interface ILoyaltyTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earn' | 'spend';
  reason: string;
  amount: number;
  timestamp: Date;
  bonusId?: mongoose.Schema.Types.ObjectId;
}

const LoyaltyTransactionSchema = new Schema<ILoyaltyTransaction>({
  userId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  type: { type: String, enum: ["earn", "spend"], required: true },
  reason: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  bonusId: { type: mongoose.Schema.Types.ObjectId, ref: "LoyalityPoints" },
});

export const LoyaltyTransactionModel = mongoose.models.LoyaltyTransaction || mongoose.model<ILoyaltyTransaction>("LoyaltyTransaction", LoyaltyTransactionSchema); 