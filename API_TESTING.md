# API testing with sample data

This guide covers every currently implemented API endpoint. You can use the interactive reference at `http://localhost:3000/docs` or a client such as Postman. The machine-readable reference is at `/openapi.json`.

## Before you start

1. Start MongoDB and the backend with `npm.cmd run dev`. Replace the example base URL below if your port or deployment is different.
2. Set the database, `JWT_SECRET` and Brevo email variables described in [README.md](README.md). Registration and verification require a working email service. Uploads additionally require Cloudinary credentials. Referral redemption requires MongoDB transaction support (replica set or sharded cluster).
3. Use an email address you can actually receive mail at. `ada@example.com` and passwords in this guide are sample data; replace them for your test. Use test credentials and a test database.
4. In Postman, set a collection variable `baseUrl` to `http://localhost:3000`. Requests below use `{{baseUrl}}`. Send JSON bodies as **Body > raw > JSON**; for GET and POST requests listed as having no body, leave the body empty. Successful login sets an HTTP-only `jwt` cookie. Enable your client's cookie jar and use the same host for subsequent requests. An `Authorization: Bearer` header is not used by the current authentication middleware.
5. Admin endpoints require a separate, existing, verified account with the `admin` role, provisioned through a trusted administrative process. Public registration does not permit the `admin` role. Sign in as the admin in a separate cookie jar or client session so you do not replace the candidate session. Candidate endpoints require the candidate role.

The code `123456`, IDs such as `507f1f77bcf86cd799439013`, referral codes and URLs shown in examples are **illustrations**. Copy a real email code, returned ID or newly issued referral code when instructed. The sample download URL is not functional. Database records and files are actually created by these calls.

## Health and reference

| Method and URL | Body | Expected response |
| --- | --- | --- |
| `GET {{baseUrl}}/` | None | `200` with `{ "status": "ok" }`. This does not check database health. |
| `GET {{baseUrl}}/openapi.json` | None | `200` with the OpenAPI document. |
| `GET {{baseUrl}}/docs` | None | Opens the interactive API reference. |

## 1. Register, verify and sign in

### Register: `POST {{baseUrl}}/api/v1/auth/register`

```json
{
  "fullName": "Ada Okafor",
  "email": "ada@example.com",
  "password": "ExamplePass123!",
  "role": "candidate",
  "consent": { "termsVersion": "1.0", "privacyVersion": "1.0", "accepted": true }
}
```

Use a real test inbox and the appropriate terms/privacy versions. `fullName` is 2–100 characters; the password is 8–128 characters. Available registration roles are `candidate`, `employer`, `talent`, `freelancer`, `coach`, and `instructor`. The response is deliberately generic, including when an account already exists or email delivery fails:

```json
{ "success": true, "message": "If registration can be completed, check your email for a verification code." }
```

Expected status: `202`. Check your inbox and server logs if no message arrives. A 202 alone does not confirm an account was created.

### Verify: `POST {{baseUrl}}/api/v1/auth/verify`

```json
{ "email": "ada@example.com", "code": "123456" }
```

Replace the example with the actual six-digit code received by email. On success, status `200` returns `{ "success": true, "message": "email verified successfully" }`. `POST /api/v1/auth/verify-email` is an alias with the same body and behavior; use one endpoint for a given verification, since the code is consumed.

To request another code before verification, use `POST {{baseUrl}}/api/v1/auth/resend-verification`:

```json
{ "email": "ada@example.com" }
```

Expected `200`: `{ "success": true, "message": "If the account needs verification, a code has been sent." }`.

### Login: `POST {{baseUrl}}/api/v1/auth/login`

```json
{ "email": "ada@example.com", "password": "ExamplePass123!" }
```

Expected `200` and a `jwt` cookie:

```json
{
  "success": true,
  "message": "login successfully",
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "fullName": "Ada Okafor",
    "email": "ada@example.com",
    "role": "candidate",
    "roles": ["candidate"],
    "isEmailVerified": true,
    "entitlements": []
  }
}
```

The ID will be different in your database. Verification does not log the account in; login must follow it.

| Endpoint | Body | Expected result |
| --- | --- | --- |
| `GET /api/v1/auth/me` | None | `200` with `{ "success": true, "data": <user> }` for the signed-in user. |
| `GET /api/v1/users/me` | None | Same user response as `/auth/me`. |
| `POST /api/v1/auth/refresh` | None | `200` with the user object and a renewed session cookie. |
| `POST /api/v1/auth/logout` | None | `200` with `{ "success": true, "message": "Logged out successfully" }`; clears the cookie and revokes the account's sessions. Test this last or log in again. |

Prefix paths in this table with `{{baseUrl}}`.

## 2. Candidate profile and onboarding

All requests in this section use the candidate session.

### Get draft: `GET {{baseUrl}}/api/v1/candidates/me/profile`

No body. The first call creates an empty draft if one does not exist. Copy `data.version`; a new draft normally starts at `0`. The response includes `_id`, `userId`, all profile fields, timestamps and version. Asset IDs initially are `null`.

### Save draft: `PATCH {{baseUrl}}/api/v1/candidates/me/profile`

```json
{
  "version": 0,
  "firstName": "Ada",
  "headline": "Product designer",
  "about": "I design accessible products.",
  "function": "Design",
  "specializations": ["Product design"],
  "skills": ["Research", "Figma", "Prototyping"],
  "industries": ["Health"],
  "locations": ["Lagos"],
  "remotePreference": "yes",
  "visibility": "anonymous",
  "hiddenEmployers": ["Example Company"],
  "hiddenFromAll": false,
  "currentStep": "visibility"
}
```

Replace `version` with the current value from the GET response. Expected `200` with the saved profile and a version incremented by one. On a stale version the endpoint returns `409`; GET the latest profile before retrying. Uploads also increment the version. Each selection must be unique, and there can be at most three specializations. See [candidate API guide](CANDIDATE_MEMBERSHIP_API.md) for all field limits and allowed values.

### Checklist: `GET {{baseUrl}}/api/v1/candidates/me/onboarding`

No body. After saving the example profile, a `200` response includes:

```json
{
  "success": true,
  "data": {
    "currentStep": "visibility",
    "membershipRequirementsStatus": "undecided",
    "requirements": [
      { "key": "firstName", "complete": true },
      { "key": "function", "complete": true },
      { "key": "specializations", "complete": true },
      { "key": "skills", "complete": true },
      { "key": "industries", "complete": true },
      { "key": "locations", "complete": true }
    ],
    "missingRequirements": []
  }
}
```

The checklist is informational. Membership requirements remain undecided.

## 3. Upload and download files

### Upload: `POST {{baseUrl}}/api/v1/candidates/me/assets`

Select **Body > form-data** in Postman:

| Key | Type | Example value |
| --- | --- | --- |
| `kind` | Text | `resume` (or `photo`) |
| `file` | File | Select an actual local PDF for `resume`, or JPEG/PNG for `photo`. |

Maximum file size is 5 MB. The API checks file signatures; a renamed text file is not a valid PDF or image. Let Postman generate the multipart content type and boundary. Expected `201`:

```json
{ "success": true, "data": { "id": "507f1f77bcf86cd799439014", "kind": "resume", "contentType": "application/pdf", "size": 12345 } }
```

Copy the returned `data.id`. Reload the profile before the next PATCH because the upload changes its version. Uploaded files are not malware-scanned.

### Download: `GET {{baseUrl}}/api/v1/candidates/me/assets/{id}/download`

No body. Replace `{id}` with the actual ID returned by the upload. Expected `200`:

```json
{ "success": true, "data": { "url": "https://example.com/temporary-download", "expiresIn": 300 } }
```

The real returned URL is temporary and accessible only to the owner through this endpoint. The example URL is not a real file.

## 4. Membership application and admin review

### Candidate: get status

`GET {{baseUrl}}/api/v1/candidates/me/membership-application` takes no body. Before submission, expected `200`:

```json
{
  "success": true,
  "data": {
    "application": null,
    "requirements": { "status": "undecided", "message": "Membership profile requirements have not been set yet" }
  }
}
```

### Candidate: submit

`POST {{baseUrl}}/api/v1/candidates/me/membership-application` takes no body. Expected `201`:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "status": "submitted",
    "source": "application",
    "submittedAt": "2026-01-01T10:02:00.000Z",
    "createdAt": "2026-01-01T10:02:00.000Z",
    "updatedAt": "2026-01-01T10:02:00.000Z",
    "__v": 0
  }
}
```

Copy the real `data._id` for the admin requests. A duplicate submission returns `409`; resubmission after rejection is not implemented.

### Admin: list and inspect

Using the **admin session**, call `GET {{baseUrl}}/api/v1/admin/membership-applications`, with no body. Expected `200` with `{ "success": true, "data": [ ... ] }` containing up to 100 pending records. The array can be empty.

Then call `GET {{baseUrl}}/api/v1/admin/membership-applications/{id}`, replacing `{id}` with the actual application ID. No body. Expected `200` with `{ "success": true, "data": { "application": { ... }, "profile": { ... }, "requirements": { "status": "undecided" } } }`. The profile is the current draft, not a frozen snapshot; it can be `null`.

### Admin: review

`PATCH {{baseUrl}}/api/v1/admin/membership-applications/{id}` with the real application ID:

```json
{ "status": "accepted" }
```

Use `"rejected"` to reject instead. Expected `200` with the updated application record, decision time, and reviewer ID. Only a `submitted` application can be reviewed. Switch back to the candidate session and GET the membership status to see the outcome.

## 5. Referral-based membership

To test both the review path and referral path independently, use a second verified candidate who is not already accepted. A referral can also immediately accept a pending or rejected candidate.

### Admin: create code

`POST {{baseUrl}}/api/v1/admin/referrals` takes no body and requires the admin session. Expected `201`:

```json
{ "success": true, "data": { "code": "ExampleReferralCode12345" } }
```

Copy the real code immediately; it is shown only at creation. Codes are single-use and currently have no expiry.

### Candidate: redeem code

Using the candidate session, call `POST {{baseUrl}}/api/v1/candidates/me/referrals/redeem`:

```json
{ "code": "ExampleReferralCode12345" }
```

Replace the sample with the actual unused code. Expected `200` with `data.application.status` set to `accepted`, `source` set to `referral`, and the undecided requirements object. A used or invalid code returns `400`; an already accepted member returns `409`. The endpoint is rate-limited.

## 6. Password reset

Test after the other candidate steps or sign back in afterward. `POST {{baseUrl}}/api/v1/auth/forgot-password` accepts:

```json
{ "email": "ada@example.com" }
```

Expected `200`: `{ "success": true, "message": "If the email exists, a password reset code has been sent." }`. Copy the actual six-digit code from the email and send `POST {{baseUrl}}/api/v1/auth/reset-password`:

```json
{ "email": "ada@example.com", "code": "123456", "password": "NewExamplePass123!" }
```

Expected `200`: `{ "success": true, "message": "Password reset successfully" }`. Existing sessions are revoked; login again using the new password. Reset codes expire and are single-use.

## Common errors

Validation errors contain field details where available, for example:

```json
{ "success": false, "code": "VALIDATION_ERROR", "message": "Invalid request", "details": [{ "path": "body.code", "message": "Code must be six digits" }] }
```

`401` usually means no valid session; `403` means the account lacks the required role or verification; `404` can mean an inaccessible ID or an application no longer awaiting review; `409` can mean a stale profile version or existing membership application; `429` means a rate limit was reached. A generic `500` or `503` needs server-side logs. The app currently has no configured CORS policy, so cross-origin browser testing needs appropriate server configuration; Postman and curl are not subject to browser CORS.

Resume/LinkedIn import, employer discovery and visibility enforcement, and job applications do not currently have endpoints. See [candidate API guide](CANDIDATE_MEMBERSHIP_API.md) for additional limitations.
