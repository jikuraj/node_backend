import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const authenticationUser=asyncHandler(async(req,res,next)=>{
    try {
       const token=req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer ","")
       if(!token){
        throw new ApiError(400,"Please provide token")
       }
       const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECREAT)
       const user= await User.findById(decodedToken?._id).select("-password -refreshToken")
       if(!user){
        throw new ApiError(400,"Token is not valid")
       }
       req.user=user
       next()
    } catch (error) {
        throw new ApiError(400,error?.message,"Invalid access token")
    }
})

export {authenticationUser}