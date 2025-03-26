const { default: mongoose } = require("mongoose");

const newSletterShcema =mongoose.Schema({
    number:{
        type:String,
        required:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
        unique:false
    },

    });

    const newSletterModel= mongoose.models.newSletter || mongoose.model('newSletter', newSletterShcema)

    export default newSletterModel;