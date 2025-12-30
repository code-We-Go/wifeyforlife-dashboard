import mongoose, { Schema } from "mongoose";

const InspoSchema = new Schema(
  {
    title: { type: String, required: true },
    sections: [
      {
        title: { type: String, required: true },
        images: [{ type: String }], // Array of strings (public_ids)
      },
    ],
  },
  { timestamps: true }
);

const InspoModel =
  mongoose.models.Inspo || mongoose.model("Inspo", InspoSchema);

export default InspoModel;
