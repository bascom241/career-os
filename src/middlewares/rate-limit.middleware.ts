import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AppError } from "../shared/errors/AppError.ts";

// Process-local limit. Use a shared edge limiter for multiple application instances.
const buckets = new Map<string, { count: number; until: number }>();
const windowMs = 15 * 60 * 1000;
export function rateLimit(action: string, maximum: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        for (const [key, bucket] of buckets) if (bucket.until <= now) buckets.delete(key);
        const email = typeof req.body?.email === "string" ? req.body.email : "";
        const keys = [`${action}:ip:${req.ip}`, ...(email ? [`${action}:account:${crypto.createHash("sha256").update(email).digest("hex")}`] : [])];
        const blocked = keys.map(key => buckets.get(key)).find(bucket => bucket && bucket.until > now && bucket.count >= maximum);
        if (blocked) { res.set("Retry-After", String(Math.max(1, Math.ceil((blocked.until - now) / 1000)))); return next(new AppError("Too many requests", 429)); }
        for (const key of keys) { const bucket = buckets.get(key); if (!bucket || bucket.until <= now) buckets.set(key, { count: 1, until: now + windowMs }); else bucket.count++; }
        next();
    };
}
