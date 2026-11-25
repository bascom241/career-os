import mongoose, { Schema } from "mongoose";

const referralSchema = new Schema({
    codeHash: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    redeemedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    redeemedAt: Date
}, { timestamps: true });

export default mongoose.model("Referral", referralSchema);
