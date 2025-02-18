const { default: mongoose } = require("mongoose");

const userShcema =mongoose.Schema({
    name:{
        type:String,
        // required:false
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    firstName:{
        type:String,
        required:false,
        default:''

    },
    lastName:{
        type:String,
        required:false,
        default:''
    },
    title:{
        type:String,
        required:false,
        default:'',

    },
    address:{
        type:String,
        required:false,
        default:''
    },
    phoneCode:{
        type:String,
        required:false,
        default:'',

    },
    phoneNumber:{
        type:String,
        required:false,
        default:''
    },
    dob:{
        type:String,
        required:false
    },


    emailVerified:{type: Boolean, default:false},
    

   


    });

    const userModel= mongoose.models.users || mongoose.model('users', userShcema)

    export default userModel;