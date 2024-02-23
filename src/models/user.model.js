
import mongoose ,{Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema=new Schema(
    {
      username:{
        type:String,
        required:true,
        unique:true,
        lowarcase:true,
        trim:true
      },
      email:{
        type:String,
        required:true,
        unique:true,
        lowarcase:true,
        trim:true
      },
      fullName:{
        type:String,
        required:true
      },
      avatar:{
        type:String, // take string from cloudnary
        required:true
      },
      coverImage:{
        type:String, // take string from cloudnary
      },
      watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
      }],
      password:{
        type:String,
        required:[true,'Password must be required']
      },
      refreshToken:{
        type:String
      }
    },
    {
        timestamps:true
    }
)

userSchema.pre("save",async function(next){
    if(!this.isModified('password')) return next();

    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECREAT,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.refreshAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECREAT,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model('User',userSchema)