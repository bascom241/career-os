import express from "express"
const router = express.Router(); 
import { register, login, verify, forgot, reset, logout, currentUser, resendVerify, refresh} from "../controller/auth.controller.ts";
import { rateLimit } from "../../middlewares/rate-limit.middleware.ts";
import { authenticate } from "../../middlewares/auth.middleware.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import { createUserSchema, forgotPasswordSchema, loginUserSchema, verifyEmailSchema, resetPasswordSchema } from "../schemas/user.schema.ts";

router.post("/register", validate(createUserSchema), rateLimit("register", 5), register)
router.post("/login", validate(loginUserSchema), rateLimit("login", 5), login)
router.post("/verify", validate(verifyEmailSchema), rateLimit("verify", 5), verify)
router.post("/forgot-password", validate(forgotPasswordSchema), rateLimit("forgot", 5), forgot)

router.post("/reset-password", validate(resetPasswordSchema), rateLimit("reset", 5), reset)
router.get("/me", authenticate, currentUser)
router.post("/resend-verification", validate(forgotPasswordSchema), rateLimit("resend", 5), resendVerify)
router.post("/refresh", authenticate, refresh)
router.post("/verify-email", validate(verifyEmailSchema), rateLimit("verify", 5), verify)
router.post("/logout", authenticate, logout)

export default router 