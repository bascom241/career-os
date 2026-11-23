import express from "express"
const router = express.Router(); 
import { register, login, verify, forgot} from "../controller/auth.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import { createUserSchema, forgotPasswordSchema, loginUserSchema, verifyEmailSchema } from "../schemas/user.schema.ts";

router.post("/register", validate(createUserSchema), register)
router.post("/login", validate(loginUserSchema), login)
router.post("/verify", validate(verifyEmailSchema), verify)
router.post("/forgot-password", validate(forgotPasswordSchema), forgot)

export default router 