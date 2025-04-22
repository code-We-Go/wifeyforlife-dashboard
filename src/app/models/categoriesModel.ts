const { default: mongoose } = require("mongoose");

const categoriesShcema =mongoose.Schema({
    categoryName:{
        type:String,
        required:true,
    },
    description:{type:String,
        required:false
    },
    });

    const categoriesModel= mongoose.models.categories || mongoose.model('categories', categoriesShcema)

    export default categoriesModel;