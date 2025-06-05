import { SchemaTypes } from "mongoose";

const { default: mongoose } = require("mongoose");

const Schema =mongoose.Schema({
    subCategoryName:{
        type:String,
        required:true
    },
    CategoryID:{type:mongoose.Schema.Types.ObjectId,
        ref:"categories"
    },


    description:{
        type:String,
    },


    });

    const subCategoriesModel= mongoose.models.subCategories || mongoose.model('subCategories', Schema)

    export default subCategoriesModel;