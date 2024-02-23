import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'


const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.refreshAccessToken()

        user.refreshToken=refreshToken

        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        console.log(error);
        throw new ApiError(500,"Something went wrong while generating the tokens")
    }
}

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

const userLogin=asyncHandler(async(req,res)=>{
    //req.body=>data
    //vaidation
    //checking password
    //access and refreshToken
    //send cookies
    //return res

    const {email,username,password}=req.body
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    
    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"user does not exits")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(400,"Invalid user credential")
    }

    const {refreshToken,accessToken}=await generateAccessAndRefreshTokens(user._id)
    const logedInuser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res
             .status(200)
             .cookie("accessToken",accessToken,options)
             .cookie("refreshToken",refreshToken,options)
             .json(new ApiResponse(
                200,
                {
                user:logedInuser,accessToken,refreshToken
                },
             "user logedIn successfully"
             ))
})

const userLogedOut=asyncHandler(async(req,res)=>{
    
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

return res
         .status(200)
         .clearCookie("accessToken",options)
         .clearCookie("refreshToken",options)
         .json(new ApiResponse(200,{},"user logedOut successfully"))
})



export {
    registerUser,
    userLogin,
    userLogedOut
}