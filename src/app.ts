import express from "express"
import cookieParser from "cookie-parser"
import { errorHandler } from "./middlewares/error.middleware.ts"
import authRouter from "./auth/routes/user.route.ts"
import type { NextFunction, Request, Response } from "express"
import { apiReference } from "@scalar/express-api-reference"
import { openapi } from "./docs/openapi.ts"
import dotenv from "dotenv"


const app = express()

dotenv.config()

app.use(express.json())
app.use(cookieParser())

app.get("/openapi.json", (_req, res) => res.json(openapi))
app.use("/docs", apiReference({ url: "/openapi.json" }))



app.use("/api/v1/auth", authRouter)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    errorHandler(err, res)
})
export default app
