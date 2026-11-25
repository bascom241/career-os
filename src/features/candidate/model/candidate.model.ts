import mongoose, { Schema } from "mongoose";

const candidateSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, default: "" },
    headline: { type: String, default: "" },
    about: { type: String, default: "" },
    photoAssetId: { type: Schema.Types.ObjectId, ref: "CandidateAsset", default: null },
    resumeAssetId: { type: Schema.Types.ObjectId, ref: "CandidateAsset", default: null },
    function: { type: String, default: "" },
    specializations: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    industries: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    remotePreference: { type: String, enum: ["yes", "no", "undecided"], default: "undecided" },
    visibility: { type: String, enum: ["anonymous", "open"], default: "anonymous" },
    hiddenEmployers: { type: [String], default: [] },
    hiddenFromAll: { type: Boolean, default: false },
    currentStep: { type: String, default: "account" },
    version: { type: Number, default: 0 }
}, { timestamps: true });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
