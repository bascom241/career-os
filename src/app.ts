import express from "express"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middleware.ts"
import authRouter from "./features/auth/routes/auth.route.ts"
import candidateRouter from "./features/candidate/routes/candidate.route.ts"
import { membershipRouter, adminMembershipRouter } from "./features/membership/routes/membership.route.ts"
import type { NextFunction, Request, Response } from "express"
import { apiReference } from "@scalar/express-api-reference"
import { openapi } from "./docs/openapi.ts"
import dotenv from "dotenv"
import { authenticate } from "./middlewares/auth.middleware.ts"
import { currentUser } from "./features/auth/controller/auth.controller.ts"
import { AppError } from "./shared/errors/AppError.ts"


const app = express()

dotenv.config()

// Set TRUST_PROXY to the exact proxy IPs or CIDRs under your control.
if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY.split(",").map(value => value.trim()));
app.use((req, _res, next) => {
    const isCandidateUpload = req.method === "POST" && /^\/api\/v1\/candidates\/me\/assets\/?$/i.test(req.path) && req.is("multipart/form-data");
    if (["POST", "PUT", "PATCH"].includes(req.method) && (req.headers["content-length"] !== undefined || req.headers["transfer-encoding"]) && !req.is("application/json") && !isCandidateUpload) return next(new AppError("Content-Type must be application/json", 415));
    next();
});
app.use(express.json({ limit: "100kb", strict: true }))
app.use(cookieParser())

app.get("/", (_req, res) => res.status(200).json({ status: "ok" }))
app.get("/openapi.json", (_req, res) => res.json(openapi))
app.use("/docs", apiReference({ url: "/openapi.json" }))



app.use("/api/v1/auth", authRouter)
app.use("/api/v1/candidates", candidateRouter)
app.use("/api/v1/candidates", membershipRouter)
app.use("/api/v1/admin", adminMembershipRouter)
app.get("/api/v1/users/me", authenticate, currentUser)

app.use((_req, _res, next) => next(new AppError("Route not found", 404)))

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    errorHandler(err, res)
})
export default app
