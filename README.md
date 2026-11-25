import mongoose from "mongoose";
export const connectDb = async () => {
    const uri = process.env.NODE_ENV === "production" ? process.env.live_mongo_url : process.env.mongo_url;
    if (!uri) throw new Error("Database URL is not configured");
    await mongoose.connect(uri);
    const indexes = await mongoose.connection.collection("users").indexes().catch((error: { codeName?: string }) => { if (error.codeName === "NamespaceNotFound") return []; throw error; });
    if (!indexes.some(index => index.key?.email === 1 && Object.keys(index.key).length === 1 && index.unique === true)) {
        throw new Error("Unique email index missing; run the email migration before starting the server");
    }
    console.log("Connected to database");
};
