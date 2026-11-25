import mongoose from "mongoose";
import crypto from "crypto";
import Asset from "../model/asset.model.ts";
import Candidate from "../model/candidate.model.ts";
import { AppError } from "../../../shared/errors/AppError.ts";
import { validateCandidateAsset } from "./asset-validation.service.ts";
import { createAssetDownloadUrl, deletePrivateAsset, uploadPrivateAsset } from "./cloudinary.service.ts";

export const uploadAsset = async (userId: string, kind: unknown, file?: Express.Multer.File) => {
    const validated = validateCandidateAsset(kind, file);
    const publicId = `candidate-assets/${crypto.randomUUID()}${validated.extension}`;

    await uploadPrivateAsset(publicId, validated.resourceType, validated.buffer);
    try {
        const asset = await Asset.create({
            userId,
            kind: validated.kind,
            publicId,
            resourceType: validated.resourceType,
            contentType: validated.contentType,
            size: validated.buffer.length
        });

        const profileField = validated.kind === "photo" ? "photoAssetId" : "resumeAssetId";
        await Candidate.findOneAndUpdate(
            { userId },
            { $set: { [profileField]: asset._id }, $inc: { version: 1 } },
            { upsert: true }
        );
        return { id: asset.id, kind: asset.kind, contentType: asset.contentType, size: asset.size };
    } catch (error) {
        await Asset.deleteOne({ userId, publicId }).catch(() => console.error("Failed to remove candidate asset record"));
        await deletePrivateAsset(publicId, validated.resourceType).catch(() => console.error("Failed to remove candidate asset from Cloudinary"));
        throw error;
    }
};

export const getAssetDownload = async (userId: string, assetId: string) => {
    if (!mongoose.isValidObjectId(assetId)) throw new AppError("Asset not found", 404);
    const asset = await Asset.findOne({ _id: assetId, userId });
    if (!asset) throw new AppError("Asset not found", 404);
    if (asset.resourceType !== "image" && asset.resourceType !== "raw") throw new AppError("Invalid asset resource type", 500);

    const expiresIn = 300;
    const url = createAssetDownloadUrl(asset.publicId, asset.resourceType, expiresIn);
    return { url, expiresIn };
};
