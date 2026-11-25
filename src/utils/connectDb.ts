import mongoose from "mongoose";
export const connectDb = async () => {
    const uri = process.env.MONGODB_URI ?? (process.env.NODE_ENV === "production" ? process.env.live_mongo_url : process.env.mongo_url);
    if (!uri) throw new Error("Database URL is not configured");
    await mongoose.connect(uri);
  
    console.log("Connected to database");
};
