const { default: mongoose } = require("mongoose");

const collectionsShcema =mongoose.Schema({
    collectionName:{
        type:String,
        required:true,
    },
    });

    const collectionsModel= mongoose.models.collections || mongoose.model('collections', collectionsShcema)

    export default collectionsModel;