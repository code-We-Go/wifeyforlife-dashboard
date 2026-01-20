import mongoose, { Schema, Document } from "mongoose";

export interface IWeddingTimeline extends Document {
  userId?: string;
  zaffaTime: string; // The anchor time
  selectedFeatures: {
    name: string;
    duration: number;
    enabled: boolean;
  }[];
  events: {
    id: string;
    brideActivity: string;
    groomActivity: string;
    bridesmaidsActivity: string;
    groomsmenActivity: string;
    duration: number;
    timeLabel?: string;
  }[];
  shareToken?: string; // Unique token for sharing read-only timeline
  feedback?: {
    easeOfUse: number; // 1-5 star rating
    satisfaction: number; // 1-5 star rating
    timeSaved: string; // "2-7 days" | "7-14 days" | "era"
    feelings: string[]; // Multiple selection: ["less_stressed", "more_organized", etc.]
    recommend: string; // "definitely_not" | "maybe" | "definitely_yes"
    comment?: string;
  }; 
  createdAt: Date;
}

const EventSchema = new Schema({
  id: { type: String, required: true },
  brideActivity: { type: String, default: "" },
  groomActivity: { type: String, default: "" },
  bridesmaidsActivity: { type: String, default: "" },
  groomsmenActivity: { type: String, default: "" },
  duration: { type: Number, required: true },
  timeLabel: { type: String },
});

const SelectedFeatureSchema = new Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  enabled: { type: Boolean, default: true },
});

const WeddingTimelineSchema = new Schema<IWeddingTimeline>(
  {
    userId: { type: String, required: false },
    zaffaTime: { type: String, required: true },
    selectedFeatures: [SelectedFeatureSchema],
    events: [EventSchema],
    shareToken: { type: String, required: false, unique: true, sparse: true },
    feedback: {
      easeOfUse: { type: Number },
      satisfaction: { type: Number },
      timeSaved: { type: String },
      feelings: [{ type: String }],
      recommend: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true }
);

const WeddingTimelineModel =
  mongoose.models.WeddingTimeline ||
  mongoose.model<IWeddingTimeline>("WeddingTimeline", WeddingTimelineSchema);

export default WeddingTimelineModel;
