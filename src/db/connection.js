import mongoose from "mongoose";
import DB_NAME from "../constants.js";

const connectionDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.DB_URI_DEV}/${DB_NAME}`)
        console.log(`mongoDB is connection and hosted on ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log('DB connection error',error);
        process.exit(1)
    }
}

export default connectionDB