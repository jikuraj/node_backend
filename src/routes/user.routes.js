import {Router} from 'express'
import { changePassword, editAvatarImage, editUser, getUserDetail, refreshTokenAgain, registerUser, userLogedOut, userLogin } from '../controllers/user.controller.js'
import {upload} from "../midalwares/multer.middalware.js"
import { authenticationUser } from '../midalwares/auth.middleware.js'




const router=Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )
router.route("/login").post(userLogin)


//secured routes
router.route("/logout").post(authenticationUser,userLogedOut)
router.route("/refresh-token").post(refreshTokenAgain)
router.route("/changePassword").post(authenticationUser,changePassword)
router.route("/edituser").post(authenticationUser,editUser)
router.route("/getuser").get(authenticationUser,getUserDetail)
router.route("/editavatar").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    }
]),authenticationUser,editAvatarImage)



export {
    router
}
