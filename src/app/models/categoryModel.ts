const { default: mongoose } = require("mongoose");

const Shcema =mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imgUrl:{
        type:String,
    },


    });

    const categoriesModel= mongoose.models.categories || mongoose.model('categories', Shcema)

    export default categoriesModel;