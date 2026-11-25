import multer from "multer";

export const candidateAssetUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1 }
}).single("file");
