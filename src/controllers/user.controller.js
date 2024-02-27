import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary';


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

    if(!fullName) throw new ApiError(400,"fullName is required")
    if(!email) throw new ApiError(400,"email is required")
    if(!username) throw new ApiError(400,"username is required")
    if(!password) throw new ApiError(400,"password is required")

    if([username,email,fullName,password].some((feilds)=>feilds?.trim()==="")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User and email allready exits")
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

const refreshTokenAgain=asyncHandler(async(req,res)=>{
    try {
        const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken) throw new ApiError(401,"unathrised refresh token")

        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECREAT)
        const user=await User.findById(decodedToken?._id)
        // console.log("user:0",user);
        if(!user)throw new ApiError(400,"Invalid Token")
        
        if(incomingRefreshToken!==user?.refreshToken) throw new ApiError(400,"Token has been expired")

        const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
        // console.log("newRefreshToken",refreshToken);
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
                        accessToken,
                        refreshToken
                    },
                    "Refresh token generated"
                    ))
    } catch (error) {
        // console.log(error);
        throw new ApiError(401, "Invalid refresh token")
    }
})

const changePassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    if(!oldpassword||!newpassword) throw new ApiError(400,"Please provide old and new password")
    const user=await User.findById(req.user._id)
    
    const isPasswordValid=await user.isPasswordCorrect(oldpassword)
    // console.log("password vaild",isPasswordValid);
    if(!isPasswordValid) throw new ApiError(400,"OldPassword not matched")
    user.password=newpassword
    await user.save({validateBeforeSave:false})
    return res
            .status(200)
            .json(new ApiResponse(200,{},"Password changed successfully"))
})

const editUser=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName) throw new ApiError(400,"Please provide fullName")
    if(!email) throw new ApiError(400,"Please provide email")

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
        $set:{
               fullName,
               email
             }
    },
    {
        new:true
    }
    ).select("-password -refreshToken")

    return res
           .status(200)
           .json(new ApiResponse(200,{user},"User Updated successfully"))
})

const getUserDetail=asyncHandler(async(req,res)=>{
    // console.log(req.user);
    const user=req.user
    return res
             .status(200)
             .json(new ApiResponse(200,{user},"User details fetched successfully"))
})

const editAvatarImage=asyncHandler(async(req,res)=>{
    //    console.log(req.files);

    const avatarLocalPath=req.files.avatar[0]?.path
    
    if(!avatarLocalPath)throw new ApiError(400,"please provide avatar image")

    const user=await User.findById(req.user?._id)
    console.log(".....///",user.avatar);

    deleteFromCloudinary(user.avatar)

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    // console.log(avatar.url);

    

    const Updateduser=await User.findByIdAndUpdate(
             req.user?._id,
             {
                $set:{
                    avatar:avatar.url
                }
             },
             {
                new:true
             }
        ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,{Updateduser},"Avatart updated successfully"))
})
const editCoverImage=asyncHandler(async(req,res)=>{
    //    console.log(req.files);

    const coverImageLocalPath=req.files.coverImage[0]?.path
    
    if(!coverImageLocalPath)throw new ApiError(400,"please provide cover image")

    const user=await User.findById(req.user?._id)

    if(user.coverImage!==""){
         deleteFromCloudinary(user.coverImage)
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    // console.log(avatar.url);

    const updateduser=await User.findByIdAndUpdate(
             req.user?._id,
             {
                $set:{
                    coverImage:coverImage.url
                }
             },
             {
                new:true
             }
        ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200,{updateduser},"coverImage updated successfully"))
})

const getUserChannelprofile=asyncHandler(async(req,res)=>{
    const {username}=req.params;
    if(!username){
        throw new ApiError(400,"username does not exits")
    }
    /*

       An aggregation pipeline consists of one or more stages that process documents:
       
       Each stage performs an operation on the input documents. For example,
                    a stage can filter documents, group documents, and calculate values.
       
       The documents that are output from a stage are passed to the next stage.
       
       An aggregation pipeline can return results for groups of documents. For example,
        return the total, average, maximum, and minimum values.
    */

    const channel=await User.aggregate([
        {
            $match:{
                username:username
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribersTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubcriberCount:{
                    $size:"$subscribersTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                         then:true,
                         else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount,
                channelSubcriberCount,
                isSubscribed,
                avatar,
                coverImage,
                email
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400,"Unable to get the details of user")
    }

    console.log("//////////////////////----------",channel);

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User details fetched successfully"))
})

export {
    registerUser,
    userLogin,
    userLogedOut,
    refreshTokenAgain,
    changePassword,
    editUser,
    getUserDetail,
    editAvatarImage,
    editCoverImage,
    getUserChannelprofile
}