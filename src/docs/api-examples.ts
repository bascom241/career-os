// Illustrative values only. IDs, codes, URLs and timestamps must come from your test environment.
const email = "ada@example.com";
const code = "123456";
const user = { id: "507f1f77bcf86cd799439012", fullName: "Ada Okafor", email, role: "candidate", roles: ["candidate"], isEmailVerified: true, entitlements: [] };
const profile = {
    _id: "507f1f77bcf86cd799439011", userId: user.id, firstName: "Ada", headline: "Product designer", about: "I design accessible products.",
    photoAssetId: null, resumeAssetId: null, function: "Design", specializations: ["Product design"], skills: ["Research", "Figma", "Prototyping"],
    industries: ["Health"], locations: ["Lagos"], remotePreference: "yes", visibility: "anonymous", hiddenEmployers: ["Example Company"],
    hiddenFromAll: false, currentStep: "visibility", version: 1, createdAt: "2026-01-01T10:00:00.000Z", updatedAt: "2026-01-01T10:01:00.000Z", __v: 0
};
const application = { _id: "507f1f77bcf86cd799439013", userId: user.id, status: "submitted", source: "application", submittedAt: "2026-01-01T10:02:00.000Z", createdAt: "2026-01-01T10:02:00.000Z", updatedAt: "2026-01-01T10:02:00.000Z", __v: 0 };
const requirements = { status: "undecided", message: "Membership profile requirements have not been set yet" };
const envelope = (data: unknown) => ({ success: true, data });
const message = (value: string) => ({ success: true, message: value });

export interface ApiExample {
    body?: object;
    response: object;
    status?: string;
}

export const apiExamples: Record<string, ApiExample> = {
    "POST /api/v1/auth/register": { status: "202", body: { fullName: "Ada Okafor", email, password: "ExamplePass123!", role: "candidate", consent: { termsVersion: "1.0", privacyVersion: "1.0", accepted: true } }, response: message("If registration can be completed, check your email for a verification code.") },
    "POST /api/v1/auth/login": { body: { email, password: "ExamplePass123!" }, response: { success: true, message: "login successfully", data: user } },
    "POST /api/v1/auth/verify": { body: { email, code }, response: message("email verified successfully") },
    "POST /api/v1/auth/verify-email": { body: { email, code }, response: message("email verified successfully") },
    "POST /api/v1/auth/resend-verification": { body: { email }, response: message("If the account needs verification, a code has been sent.") },
    "POST /api/v1/auth/forgot-password": { body: { email }, response: message("If the email exists, a password reset code has been sent.") },
    "POST /api/v1/auth/reset-password": { body: { email, code, password: "NewExamplePass123!" }, response: message("Password reset successfully") },
    "GET /api/v1/auth/me": { response: envelope(user) },
    "GET /api/v1/users/me": { response: envelope(user) },
    "POST /api/v1/auth/refresh": { response: envelope(user) },
    "POST /api/v1/auth/logout": { response: message("Logged out successfully") },
    "GET /api/v1/candidates/me/profile": { response: envelope(profile) },
    "PATCH /api/v1/candidates/me/profile": { body: { version: 0, firstName: "Ada", headline: "Product designer", about: "I design accessible products.", function: "Design", specializations: ["Product design"], skills: ["Research", "Figma", "Prototyping"], industries: ["Health"], locations: ["Lagos"], remotePreference: "yes", visibility: "anonymous", hiddenEmployers: ["Example Company"], hiddenFromAll: false, currentStep: "visibility" }, response: envelope(profile) },
    "GET /api/v1/candidates/me/onboarding": { response: envelope({ currentStep: "visibility", membershipRequirementsStatus: "undecided", requirements: ["firstName", "function", "specializations", "skills", "industries", "locations"].map(key => ({ key, complete: true })), missingRequirements: [] }) },
    "POST /api/v1/candidates/me/assets": { status: "201", response: envelope({ id: "507f1f77bcf86cd799439014", kind: "resume", contentType: "application/pdf", size: 12345 }) },
    "GET /api/v1/candidates/me/assets/{id}/download": { response: envelope({ url: "https://example.com/temporary-download", expiresIn: 300 }) },
    "GET /api/v1/candidates/me/membership-application": { response: envelope({ application: null, requirements }) },
    "POST /api/v1/candidates/me/membership-application": { status: "201", response: envelope(application) },
    "POST /api/v1/candidates/me/referrals/redeem": { body: { code: "ExampleReferralCode12345" }, response: envelope({ application: { _id: application._id, status: "accepted", source: "referral", submittedAt: application.submittedAt, decidedAt: "2026-01-01T10:05:00.000Z" }, requirements }) },
    "POST /api/v1/admin/referrals": { status: "201", response: envelope({ code: "ExampleReferralCode12345" }) },
    "GET /api/v1/admin/membership-applications": { response: envelope([application]) },
    "GET /api/v1/admin/membership-applications/{id}": { response: envelope({ application, profile, requirements: { status: "undecided" } }) },
    "PATCH /api/v1/admin/membership-applications/{id}": { body: { status: "accepted" }, response: envelope({ ...application, status: "accepted", decidedAt: "2026-01-01T10:05:00.000Z", decidedBy: "507f1f77bcf86cd799439015", updatedAt: "2026-01-01T10:05:00.000Z" }) }
};
