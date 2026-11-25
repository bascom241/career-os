import Candidate from "../model/candidate.model.ts";
import type { CandidateProfileInput } from "../schemas/candidate.schema.ts";
import { AppError } from "../../../shared/errors/AppError.ts";

export const getCandidateProfile = async (userId: string) => {
    let profile = await Candidate.findOne({ userId });
    if (!profile) {
        try {
            profile = await Candidate.create({ userId });
        } catch (error) {
            if ((error as { code?: number }).code !== 11000) throw error;
            profile = await Candidate.findOne({ userId });
            if (!profile) throw error;
        }
    }
    return profile;
};

export const updateCandidateProfile = async (userId: string, data: CandidateProfileInput) => {
    await getCandidateProfile(userId);
    const { version, ...fields } = data;
    const profile = await Candidate.findOneAndUpdate(
        { userId, version },
        { $set: fields, $inc: { version: 1 } },
        { returnDocument: "after", runValidators: true }
    );
    if (!profile) throw new AppError("Profile has changed. Reload it before saving again", 409);
    return profile;
};

