import { z } from "zod";

// Normalise before validating so lookups and writes use the same value.
const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = z.string().min(8, "Password must be at least 8 characters").max(128);
const code = z.string().regex(/^\d{6}$/, "Code must be six digits");
export const createUserSchema = z.object({ body: z.strictObject({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
    email, password, role: z.enum(["candidate", "employer", "talent", "freelancer", "coach", "instructor"]),
    consent: z.strictObject({ termsVersion: z.string().trim().min(1).max(100), privacyVersion: z.string().trim().min(1).max(100), accepted: z.literal(true) })
}) });
export const loginUserSchema = z.object({ body: z.strictObject({ email, password: z.string().min(1).max(128) }) });
export const verifyEmailSchema = z.object({ body: z.strictObject({ email, code }) });
export const forgotPasswordSchema = z.object({ body: z.strictObject({ email }) });
export const resetPasswordSchema = z.object({ body: z.strictObject({ email, code, password }) });
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
