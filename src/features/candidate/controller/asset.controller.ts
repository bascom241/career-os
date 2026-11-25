import type { Request, Response, NextFunction } from "express";
import { getAssetDownload, uploadAsset } from "../service/asset.service.ts";

export async function uploadCandidateAsset(req: Request, res: Response, next: NextFunction) {
    try {
        const asset = await uploadAsset(res.locals.user.id, req.body.kind, req.file);
        res.status(201).json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
}

export async function downloadCandidateAsset(req: Request, res: Response, next: NextFunction) {
    try {
        const download = await getAssetDownload(res.locals.user.id, String(req.params.id));
        res.set("Cache-Control", "no-store").json({ success: true, data: download });
    } catch (error) {
        next(error);
    }
}
