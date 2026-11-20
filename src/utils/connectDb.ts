import { AppError } from "../shared/errors/AppError.ts";
import mongoose from "mongoose";
export const connectDb = async () => {

    const localUrI = process.env.mongo_url;
    const remoteUrI = process.env.live_mongo_url; 
    const devEnv = process.env.NODE_ENV
    try{
        if(!localUrI || !remoteUrI){
            throw new AppError(devEnv === "production" ? "internal server error" : "Env secret not configured")
        }

        if(devEnv === "production"){
            await mongoose.connect(remoteUrI)
            console.log("Connected to Database")
        } else {
            await mongoose.connect(localUrI)
            console.log("connected to database")
        } 
    
    }catch(err){
        console.log(err)
    }
}