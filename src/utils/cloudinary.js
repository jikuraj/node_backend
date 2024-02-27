import {v2 as cloudinary} from 'cloudinary';
import { extractPublicId } from 'cloudinary-build-url'
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: 'dn0adoqwa', 
  api_key: '969888249317564', 
  api_secret: 'eRDLPxGj8QMOhRJVeg3nV3m6tZc' 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        // return null;
    }
}

const deleteFromCloudinary=async(url)=>{
    try {
        const publicId = extractPublicId(
            `${url}`
          )
        const deleteImage=await cloudinary.uploader.destroy(`${publicId}`,(results)=>{
            console.log("previous image deleted successfully");
        })

        return deleteImage;
    } catch (error) {
        console.log(error);
    }
}



// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });

export {uploadOnCloudinary,deleteFromCloudinary}