import crypto from "crypto";
import mongoose from "mongoose";
import Membership from "../model/membership.model.ts";
import Referral from "../model/referral.model.ts";
import Candidate from "../../candidate/model/candidate.model.ts";
import { AppError } from "../../../shared/errors/AppError.ts";

const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

export const getMembership = async (userId: string) => {
    const application = await Membership.findOne({ userId }).select("status source submittedAt decidedAt");
    return { application, requirements: { status: "undecided", message: "Membership profile requirements have not been set yet" } };
};

export const submitMembership = async (userId: string) => {
    try {
        return await Membership.create({ userId, status: "submitted", source: "application" });
    } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new AppError("A membership application already exists", 409);
        throw error;
    }
};

export const createReferral = async (adminId: string) => {
    const code = crypto.randomBytes(18).toString("base64url");
    await Referral.create({ codeHash: hashCode(code), createdBy: adminId });
    return { code };
};

export const redeemReferral = async (userId: string, code: string) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const existing = await Membership.findOne({ userId }).session(session);
            if (existing?.status === "accepted") throw new AppError("Already a member", 409);
            const referral = await Referral.findOneAndUpdate(
                { codeHash: hashCode(code), redeemedBy: null },
                { $set: { redeemedBy: userId, redeemedAt: new Date() } },
                { session, returnDocument: "after" }
            );
            if (!referral) throw new AppError("Invalid or already used referral code", 400);
            await Membership.updateOne({ userId }, { $set: { status: "accepted", source: "referral", decidedAt: new Date() }, $unset: { decidedBy: 1 }, $setOnInsert: { submittedAt: new Date() } }, { upsert: true, session });
        });
        return await getMembership(userId);
    } finally {
        await session.endSession();
    }
};

export const reviewMembership = async (id: string, adminId: string, status: "accepted" | "rejected") => {
    if (!mongoose.isValidObjectId(id)) throw new AppError("Application not found", 404);
    const application = await Membership.findOneAndUpdate({ _id: id, status: "submitted" }, { $set: { status, decidedBy: adminId, decidedAt: new Date() } }, { returnDocument: "after" });
    if (!application) throw new AppError("Application not found or already reviewed", 404);
    return application;
};

export const listMembershipApplications = async () => {
    return Membership.find({ status: "submitted" }).sort({ submittedAt: 1 }).limit(100);
};

export const getMembershipApplicationForReview = async (id: string) => {
    if (!mongoose.isValidObjectId(id)) throw new AppError("Application not found", 404);
    const application = await Membership.findById(id);
    if (!application) throw new AppError("Application not found", 404);
    const profile = await Candidate.findOne({ userId: application.userId });
    return { application, profile, requirements: { status: "undecided" } };
};
