import express from "express";
import { authenticate, requireRole } from "../../../middlewares/auth.middleware.ts";
import { validate } from "../../../middlewares/validate.middleware.ts";
import { rateLimit } from "../../../middlewares/rate-limit.middleware.ts";
import { referralSchema, reviewSchema } from "../schemas/membership.schema.ts";
import { createCode, getApplication, getApplicationForReview, listApplications, redeemCode, reviewApplication, submitApplication } from "../controller/membership.controller.ts";

export const membershipRouter = express.Router();
membershipRouter.use(authenticate, requireRole("candidate"));
membershipRouter.get("/me/membership-application", getApplication);
membershipRouter.post("/me/membership-application", submitApplication);
membershipRouter.post("/me/referrals/redeem", rateLimit("referral", 10), validate(referralSchema), redeemCode);

export const adminMembershipRouter = express.Router();
adminMembershipRouter.use(authenticate, requireRole("admin"));
adminMembershipRouter.post("/referrals", createCode);
adminMembershipRouter.get("/membership-applications", listApplications);
adminMembershipRouter.get("/membership-applications/:id", getApplicationForReview);
adminMembershipRouter.patch("/membership-applications/:id", validate(reviewSchema), reviewApplication);
