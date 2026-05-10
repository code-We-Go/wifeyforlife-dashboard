const mongoose = require("mongoose");

const categoriesSchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  HomePage: { type: Boolean, default: false },
  type:{
    type: String,
    enum: ["wedding-planning", "product",],
    default: "product",
  },
  active: { type: Boolean, default: true },
});
console.log('Registering CategoryModel');
const categoriesModel =
  mongoose.models.categories || mongoose.model("categories", categoriesSchema);

export default categoriesModel;
