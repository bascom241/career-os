import express from "express";
import { authenticate, requireRole } from "../../../middlewares/auth.middleware.ts";
import { validate } from "../../../middlewares/validate.middleware.ts";
import { candidateProfileSchema } from "../schemas/candidate.schema.ts";
import { getProfile, updateProfile, getOnboarding } from "../controller/candidate.controller.ts";
import { uploadCandidateAsset, downloadCandidateAsset } from "../controller/asset.controller.ts";
import { candidateAssetUpload } from "../middleware/asset-upload.middleware.ts";

const router = express.Router();

router.use(authenticate, requireRole("candidate"));
router.get("/me/profile", getProfile);
router.patch("/me/profile", validate(candidateProfileSchema), updateProfile);
router.get("/me/onboarding", getOnboarding);
router.post("/me/assets", candidateAssetUpload, uploadCandidateAsset);
router.get("/me/assets/:id/download", downloadCandidateAsset);

export default router;
