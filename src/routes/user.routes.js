import {Router} from 'express'
import { registerUser, userLogedOut, userLogin } from '../controllers/user.controller.js'
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
router.route("/logout").post(authenticationUser,userLogedOut)


export {
    router
}
