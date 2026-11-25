import express from "express"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middleware.ts"
import authRouter from "./auth/routes/user.route.ts"
import type { NextFunction, Request, Response } from "express"
import { apiReference } from "@scalar/express-api-reference"
import { openapi } from "./docs/openapi.ts"
import dotenv from "dotenv"
import { authenticate } from "./middlewares/auth.middleware.ts"
import { currentUser } from "./auth/controller/auth.controller.ts"
import { AppError } from "./shared/errors/AppError.ts"


const app = express()

dotenv.config()

// Set TRUST_PROXY to the exact proxy IPs or CIDRs under your control.
if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY.split(",").map(value => value.trim()));
app.use((req, _res, next) => {
    if (["POST", "PUT", "PATCH"].includes(req.method) && (req.headers["content-length"] !== undefined || req.headers["transfer-encoding"]) && !req.is("application/json")) return next(new AppError("Content-Type must be application/json", 415));
    next();
});
app.use(express.json({ limit: "100kb", strict: true }))
app.use(cookieParser())

app.get("/", (_req, res) => res.status(200).json({ status: "ok" }))
app.get("/openapi.json", (_req, res) => res.json(openapi))
app.use("/docs", apiReference({ url: "/openapi.json" }))



app.use("/api/v1/auth", authRouter)
app.get("/api/v1/users/me", authenticate, currentUser)

app.use((_req, _res, next) => next(new AppError("Route not found", 404)))

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    errorHandler(err, res)
})
export default app
