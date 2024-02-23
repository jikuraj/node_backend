import env from 'dotenv'

import connectionDB from './db/connection.js'
import {app} from './app.js'


env.config({
    path:'./home'
})

 connectionDB()
 .then(()=>{
   app.listen(process.env.PORT,()=>{
    console.log('application is ruuning on port:',process.env.PORT);
   })
 })
 .catch((error)=>{
     console.log('server is not connected with db',error);
 })












/*
import express from 'express'

const app=express()
;(async()=>{
    try {
         await mongoose.connect(`${process.env.DB_URI_DEV}/${DB_NAME}`)
          app.on('error',(error)=>{
               console.log('error in connection with db',error);
               throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`app is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log('connetion error in Db',error);
        throw error
    }
})()

*/






