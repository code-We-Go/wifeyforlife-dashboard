import mongoose, { Schema, Document } from "mongoose";
import { Video } from "@/interfaces/interfaces";

// Define the Video schema
const VideoSchema = new Schema<Video>({
  title: { type: String, required: true },
  description: { type: String, required: false },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, required: true },
  isPublic: { type: Boolean, default: true },
  playlistHint:{type:String,required:false},

}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create and export the Video model
const videoModel = mongoose.models.videos || mongoose.model<Video>("videos", VideoSchema);
export default videoModel; 