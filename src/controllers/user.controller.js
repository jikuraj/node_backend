import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser=asyncHandler(async (req,res)=>{
    //get data from frontend
    //validation . data is not empty
    //check user allready exit
    //check for avatar image
    //upload on cloudinary
    //check for avtar validation
    //create data for user
    
    const {username,email,fullName,password}=req.body

    if([username,email,fullName,password].some((feilds)=>feilds?.trim()==="")){
        throw new ApiError(400,"fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User allready exits")
    }

    // console.log(req.files.avatar[0].path);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    // console.log("///////////",avatarLocalPath);

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar must be required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user=await User.create({
        username,
        fullName,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })
    const userInRes= await User.findById(user._id).select(
        "-password -refreshToken"
    )
  
    return res.status(201).json(new ApiResponse(200,userInRes,"user created successfully"))
    
})



export {
    registerUser
}