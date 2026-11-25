import { z } from "zod";
import { createUserSchema, loginUserSchema, verifyEmailSchema, forgotPasswordSchema, resetPasswordSchema } from "../features/auth/schemas/user.schema.ts";
import { candidateProfileSchema } from "../features/candidate/schemas/candidate.schema.ts";
import { referralSchema, reviewSchema } from "../features/membership/schemas/membership.schema.ts";
import { candidateResponses } from "./candidate-responses.ts";
const json = (schema: object) => ({ "application/json": { schema } });
const error = { description: "Error", content: json({ $ref: "#/components/schemas/Error" }) };
const errors = { "400": error, "401": error, "403": error, "404": error, "409": error, "413": error, "415": error, "429": { ...error, headers: { "Retry-After": { schema: { type: "integer" } } } }, "500": error, "503": error };
const body = (schema: object) => ({ required: true, content: json(schema) });
const schema = (value: z.ZodType) => z.toJSONSchema(value, { target: "draft-2020-12", io: "input" });
const operation = (summary: string, request?: object, secured = false, status = "200") => ({ tags: ["Authentication"], summary, ...(request ? { requestBody: body(request) } : {}), ...(secured ? { security: [{ cookieAuth: [] }] } : {}), responses: { [status]: { description: "Success" }, ...errors } });
const success = (response: object, status = "200") => ({ [status]: { description: "Success", content: json(response) }, ...errors });
export const openapi = {
 openapi: "3.1.0", info: { title: "Career OS API", version: "1.1.0", description: "Cookie-based authentication. Verification uses a six-digit code, not a link." }, servers: [{ url: "/" }], tags: [{ name: "Authentication" }, { name: "Candidate profile" }, { name: "Membership" }],
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
  "/api/v1/auth/logout": { post: operation("Revoke all account sessions", undefined, true) },
  "/api/v1/candidates/me/profile": {
   get: { ...operation("Get or create the candidate profile draft", undefined, true), tags: ["Candidate profile"], responses: success(candidateResponses.profile) },
   patch: { ...operation("Save candidate profile fields using the current version", schema(candidateProfileSchema.shape.body), true), description: "Send the latest profile version in the JSON body. A stale version returns 409. Uploading a file also increments the version.", tags: ["Candidate profile"], responses: success(candidateResponses.profile) }
  },
  "/api/v1/candidates/me/onboarding": { get: { ...operation("Get candidate onboarding checklist", undefined, true), description: "This checklist is preliminary. Membership requirements have not been decided.", tags: ["Candidate profile"], responses: success(candidateResponses.checklist) } },
  "/api/v1/candidates/me/assets": { post: { ...operation("Upload a JPEG/PNG photo or PDF resume (max 5 MB)", undefined, true, "201"), tags: ["Candidate profile"], responses: success(candidateResponses.upload, "201"), requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", required: ["kind", "file"], properties: { kind: { type: "string", enum: ["photo", "resume"] }, file: { type: "string", format: "binary" } } } } } } } },
  "/api/v1/candidates/me/assets/{id}/download": { get: { ...operation("Get a five-minute candidate-owned asset download URL", undefined, true), tags: ["Candidate profile"], responses: success(candidateResponses.download), parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] } },
  "/api/v1/candidates/me/membership-application": { get: { ...operation("Get application and undecided requirements", undefined, true), tags: ["Membership"], responses: success(candidateResponses.membershipStatus) }, post: { ...operation("Submit an application for admin review", undefined, true, "201"), description: "No profile fields currently block submission; admission requirements are undecided.", tags: ["Membership"], responses: success(candidateResponses.membership, "201") } },
  "/api/v1/candidates/me/referrals/redeem": { post: { ...operation("Redeem a single-use code for immediate membership", schema(referralSchema.shape.body), true), tags: ["Membership"], responses: success(candidateResponses.membershipStatus) } },
  "/api/v1/admin/referrals": { post: { ...operation("Create a single-use referral code (admin)", undefined, true, "201"), tags: ["Membership"], responses: success(candidateResponses.referral, "201") } },
  "/api/v1/admin/membership-applications": { get: { ...operation("List up to 100 pending applications (admin)", undefined, true), tags: ["Membership"], responses: success(candidateResponses.membershipList) } },
  "/api/v1/admin/membership-applications/{id}": { get: { ...operation("Get an application and candidate profile (admin)", undefined, true), tags: ["Membership"], responses: success(candidateResponses.membershipDetail), parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] }, patch: { ...operation("Accept or reject a pending application (admin)", schema(reviewSchema.shape.body), true), tags: ["Membership"], responses: success(candidateResponses.membership), parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] } }
 },
 components: { securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "jwt" } }, schemas: { Error: { type: "object", required: ["success", "code", "message"], properties: { success: { const: false }, code: { type: "string" }, message: { type: "string" }, details: { type: "array", items: { type: "object", properties: { path: { type: "string" }, message: { type: "string" } } } } } } } }
};
