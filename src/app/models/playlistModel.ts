import mongoose, { Schema, Document } from "mongoose";
import { Playlist, PLAYLIST_CATEGORIES } from "@/interfaces/interfaces";

// Define the Playlist schema
const PlaylistSchema = new Schema({
  title: { type: String, required: true },
  description: { type: [String], required: false },
  category: { type: String, enum: PLAYLIST_CATEGORIES, required: false },
  isPublic:{type:Boolean,default:false},
  folders: [
    {
      name: { type: String, required: true },
      slug: { type: String, required: true },
      translations: {
        ar: {
          name: { type: String, required: false },
        },
      },
    }
  ],
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "videos",
    model: "videos",
    required: false
  }],
  thumbnailUrl: { type: String, required: true },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  translations: {
    ar: {
      title: { type: String, required: false },
      description: { type: [String], required: false },
      category: { type: String, required: false },
    },
  },
}, {
  timestamps: true // This will automatically add createdAt and updatedAt fields
});

// Create and export the Playlist model
const playlistModel = mongoose.models.playlists || mongoose.model<Playlist>("playlists", PlaylistSchema);
export default playlistModel; 