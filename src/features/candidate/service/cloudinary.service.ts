import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../../../shared/errors/AppError.ts";
import type { AssetResourceType } from "../types/asset.types.ts";

const configureCloudinary = () => {
    if (process.env.CLOUDINARY_URL) {
        const url = new URL(process.env.CLOUDINARY_URL);
        cloudinary.config({ cloud_name: url.hostname, api_key: decodeURIComponent(url.username), api_secret: decodeURIComponent(url.password), secure: true });
        return;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.cloud_name;
    const apiKey = process.env.CLOUDINARY_API_KEY ?? process.env.cloud_key;
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? process.env.cloud_secret;
    if (!cloudName || !apiKey || !apiSecret) throw new AppError("Cloudinary is not configured", 503);
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
};

export const uploadPrivateAsset = async (publicId: string, resourceType: AssetResourceType, buffer: Buffer) => {
    configureCloudinary();
    await new Promise<void>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ public_id: publicId, resource_type: resourceType, type: "authenticated", overwrite: false }, (error, result) => {
            if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
            resolve();
        });
        stream.end(buffer);
    });
};

export const deletePrivateAsset = async (publicId: string, resourceType: AssetResourceType) => {
    configureCloudinary();
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: "authenticated" });
};

export const createAssetDownloadUrl = (publicId: string, resourceType: AssetResourceType, expiresIn: number) => {
    configureCloudinary();
    return cloudinary.utils.private_download_url(publicId, "", {
        resource_type: resourceType,
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + expiresIn
    });
};
