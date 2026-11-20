import express from "express"
const router = express.Router(); 
import { register, login} from "../controller/auth.controller.ts";
import { validate } from "../../middlewares/validate.middleware.ts";
import { createUserSchema, loginUserSchema } from "../schemas/user.schema.ts";

router.post("/register", validate(createUserSchema), register)
router.post("/login", validate(loginUserSchema), login)

export default router 