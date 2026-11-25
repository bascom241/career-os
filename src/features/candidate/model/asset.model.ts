import mongoose, { Schema } from "mongoose";

const assetSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["photo", "resume"], required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model("CandidateAsset", assetSchema);
