import mongoose, { Schema } from "mongoose";

const membershipSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: ["submitted", "accepted", "rejected"], required: true },
    source: { type: String, enum: ["application", "referral"], required: true },
    submittedAt: { type: Date, default: Date.now },
    decidedAt: Date,
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Membership", membershipSchema);
