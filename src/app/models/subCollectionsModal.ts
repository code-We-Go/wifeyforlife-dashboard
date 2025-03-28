const { default: mongoose } = require("mongoose");

const Shcema =mongoose.Schema({
    subCollectionName:{
        type:String,
        required:true
    },
    collectionID:{type:String},

    imgUrl:{
        type:String,
    },
    products:{type:[String]}


    });

    const subCollectionsModel= mongoose.models.subCollections || mongoose.model('subCollections', Shcema)

    export default subCollectionsModel;