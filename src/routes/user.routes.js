import {Router} from 'express'
import { registerUser } from '../controllers/user.controller.js'
import {upload} from "../midalwares/multer.middalware.js"




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


export {
    router
}
