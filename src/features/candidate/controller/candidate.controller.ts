import type { Request, Response, NextFunction } from "express";
import { getCandidateProfile, updateCandidateProfile } from "../service/candidate.service.ts";
import { getCandidateOnboarding } from "../service/onboarding.service.ts";

export async function getProfile(_req: Request, res: Response, next: NextFunction) {
    try {
        const profile = await getCandidateProfile(res.locals.user.id);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
        const profile = await updateCandidateProfile(res.locals.user.id, req.body);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
}

export async function getOnboarding(_req: Request, res: Response, next: NextFunction) {
    try {
        const onboarding = await getCandidateOnboarding(res.locals.user.id);
        res.status(200).json({ success: true, data: onboarding });
    } catch (error) {
        next(error);
    }
}
