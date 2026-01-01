import mongoose, { Schema } from "mongoose";

const InspoSchema = new Schema(
  {
    title: { type: String, required: true },
    viewCount: { type: Number, default: 0 },
    sections: [
      {
        title: { type: String, required: true },
        viewCount: { type: Number, default: 0 },
        images: [
          {
            public_id: { type: String, required: true },
            downloadCount: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const InspoModel =
  mongoose.models.Inspo || mongoose.model("Inspo", InspoSchema);

export default InspoModel;
