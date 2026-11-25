import type { Request, Response, NextFunction } from "express";
import { createReferral, getMembership, redeemReferral, reviewMembership, submitMembership, listMembershipApplications, getMembershipApplicationForReview } from "../service/membership.service.ts";

export async function getApplication(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await getMembership(res.locals.user.id) }); } catch (error) { next(error); }
}

export async function submitApplication(_req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await submitMembership(res.locals.user.id) }); } catch (error) { next(error); }
}

export async function redeemCode(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await redeemReferral(res.locals.user.id, req.body.code) }); } catch (error) { next(error); }
}

export async function createCode(_req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await createReferral(res.locals.user.id) }); } catch (error) { next(error); }
}

export async function listApplications(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await listMembershipApplications() }); } catch (error) { next(error); }
}

export async function reviewApplication(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await reviewMembership(String(req.params.id), res.locals.user.id, req.body.status) }); } catch (error) { next(error); }
}

export async function getApplicationForReview(req: Request, res: Response, next: NextFunction) {
    try {
        const application = await getMembershipApplicationForReview(String(req.params.id));
        res.json({ success: true, data: application });
    } catch (error) { next(error); }
}
