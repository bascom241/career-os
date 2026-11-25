import { z } from "zod";

export const referralSchema = z.object({ body: z.strictObject({
    code: z.string().trim().min(8).max(100)
}) });

export const reviewSchema = z.object({ body: z.strictObject({
    status: z.enum(["accepted", "rejected"])
}) });
