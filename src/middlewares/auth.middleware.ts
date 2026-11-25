import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../features/auth/model/user.model.ts";
import { publicUser } from "../features/auth/service/auth.service.ts";
import { AppError } from "../shared/errors/AppError.ts";

/** Authenticate the HTTP-only session cookie and expose only public account fields. */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new AppError("JWT secret is not configured", 500);
        const token: unknown = req.cookies?.jwt;
        if (typeof token !== "string" || !token) throw new AppError("Authentication required", 401);
        const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
        if (typeof payload === "string" || typeof payload.userId !== "string" || !mongoose.isValidObjectId(payload.userId) || typeof payload.tokenVersion !== "number") {
            throw new AppError("Invalid session", 401);
        }
        const user = await User.findById(payload.userId).select("fullName email role roles isEmailVerified tokenVersion");
        if (!user || (user.tokenVersion ?? 0) !== payload.tokenVersion) throw new AppError("Invalid session", 401);
        if (!user.isEmailVerified) throw new AppError("Email verification required", 403);
        res.locals.user = publicUser(user);
        res.locals.tokenVersion = user.tokenVersion ?? 0;
        next();
    } catch (error) { next(error); }
}

/** Apply after authenticate to restrict a route to one or more roles. */
export function requireRole(...roles: string[]) {
    return (_req: Request, res: Response, next: NextFunction) => {
        if (!res.locals.user) return next(new AppError("Authentication required", 401));
        if (!res.locals.user.roles.some((role: string) => roles.includes(role))) return next(new AppError("Forbidden", 403));
        next();
    };
}
