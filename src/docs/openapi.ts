import { z } from "zod";
import { createUserSchema, loginUserSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "../features/auth/schemas/user.schema.ts";
const json = (schema: object) => ({ "application/json": { schema } });
const error = { description: "Error", content: json({ $ref: "#/components/schemas/Error" }) };
const errors = { "400": error, "401": error, "403": error, "404": error, "413": error, "415": error, "429": { ...error, headers: { "Retry-After": { schema: { type: "integer" } } } }, "500": error, "503": error };
const body = (schema: object) => ({ required: true, content: json(schema) });
const schema = (value: Parameters<typeof z.toJSONSchema>[0]) => z.toJSONSchema(value, { target: "draft-2020-12", io: "input" });
const operation = (summary: string, request?: object, secured = false, status = "200") => ({ tags: ["Authentication"], summary, ...(request ? { requestBody: body(request) } : {}), ...(secured ? { security: [{ cookieAuth: [] }] } : {}), responses: { [status]: { description: "Success" }, ...errors } });
export const openapi = {
 openapi: "3.1.0", info: { title: "Career OS API", version: "1.1.0", description: "Cookie-based authentication. Verification uses a six-digit code, not a link." }, servers: [{ url: "/" }], tags: [{ name: "Authentication" }],
 paths: {
  "/api/v1/auth/register": { post: operation("Register; check email for a verification code", schema(createUserSchema.shape.body), false, "202") },
  "/api/v1/auth/login": { post: operation("Log in after email verification", schema(loginUserSchema.shape.body)) },
  "/api/v1/auth/verify": { post: operation("Verify email with a code", schema(verifyEmailSchema.shape.body)) },
  "/api/v1/auth/verify-email": { post: operation("Verify email with a code", schema(verifyEmailSchema.shape.body)) },
  "/api/v1/auth/resend-verification": { post: operation("Resend a verification code", schema(forgotPasswordSchema.shape.body)) },
  "/api/v1/auth/forgot-password": { post: operation("Request a password reset", schema(forgotPasswordSchema.shape.body)) },
  "/api/v1/auth/reset-password": { post: operation("Reset a password", schema(resetPasswordSchema.shape.body)) },
  "/api/v1/auth/me": { get: operation("Get the current user", undefined, true) },
  "/api/v1/users/me": { get: operation("Get the current user", undefined, true) },
  "/api/v1/auth/refresh": { post: operation("Renew the current session", undefined, true) },
  "/api/v1/auth/logout": { post: operation("Revoke all account sessions", undefined, true) }
 },
 components: { securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "jwt" } }, schemas: { Error: { type: "object", required: ["success", "code", "message"], properties: { success: { const: false }, code: { type: "string" }, message: { type: "string" }, details: { type: "array", items: { type: "object", properties: { path: { type: "string" }, message: { type: "string" } } } } } } } }
};
