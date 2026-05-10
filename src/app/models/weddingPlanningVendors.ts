import mongoose from "mongoose";
import path from "path";

const weddingPlanningVendorsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price:{type:String,required:false},
  link:{type:String,required:false},
  images:{type:[String],required:false},
  package:{type:String,required:false},
  notes:{type:String,required:false},

  subCategoryID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "subCategories",
    // path: path.join(__dirname, "categoriesModel"),
  },

  active: { type: Boolean, default: true },
});
// console.log("Registering subCategoriesMode");
const weddingPlanningVendorsModel =
  mongoose.models.weddingPlanningVendors ||
  mongoose.model("weddingPlanningVendors", weddingPlanningVendorsSchema);

export default weddingPlanningVendorsModel;
