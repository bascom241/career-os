import { AppError } from "../../../shared/errors/AppError.ts";
import type { ValidatedAsset } from "../types/asset.types.ts";

export const validateCandidateAsset = (kind: unknown, file?: Express.Multer.File): ValidatedAsset => {
    if (!file || (kind !== "photo" && kind !== "resume")) {
        throw new AppError("Provide a photo or resume file", 400);
    }

    const buffer = file.buffer;
    const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const pdf = buffer.subarray(0, 5).toString() === "%PDF-";

    if (kind === "photo" && (jpeg || png)) {
        return { kind, buffer, contentType: jpeg ? "image/jpeg" : "image/png", resourceType: "image", extension: "" };
    }
    if (kind === "resume" && pdf) {
        return { kind, buffer, contentType: "application/pdf", resourceType: "raw", extension: ".pdf" };
    }
    throw new AppError("Use a JPEG or PNG photo, or a PDF resume", 400);
};
