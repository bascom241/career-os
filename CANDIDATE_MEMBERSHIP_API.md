# Candidate membership and uploads

All routes require a verified session cookie. Candidate routes require the candidate role; admin routes require an existing account with the `admin` role. Public registration must not be used to grant admin access. The API reference is available at `/docs`.

## Getting started

The base path is `/api/v1`. Register through `POST /auth/register`, verify the six-digit email code through `POST /auth/verify`, then sign in through `POST /auth/login`. Login sets the `jwt` HTTP-only cookie. Send that cookie with subsequent requests; browser clients must configure credentials and deployment CORS appropriately. Verification itself does not sign the user in. A candidate account is created by passing `"role": "candidate"` and the required consent object during registration. See `/docs` for the full auth request schemas.

All examples below use paths relative to `/api/v1`. JSON requests use `Content-Type: application/json`; the file upload uses `multipart/form-data`. A successful response is generally `{ "success": true, "data": ... }`. The examples use illustrative IDs and dates.

## Candidate profile

`GET /candidates/me/profile` returns the authenticated candidate's draft and creates an empty one if needed. Fields initially default to empty strings or arrays, `remotePreference: "undecided"`, `visibility: "anonymous"`, `hiddenFromAll: false`, `currentStep: "account"`, and `version: 0`. Asset IDs are initially `null`.

`PATCH /candidates/me/profile` saves only supplied fields. Include the latest `version` **in the JSON body** and at least one editable field. The response contains the updated profile with an incremented version. Omitted fields are unchanged; explicit `null` is not supported. Unknown fields are rejected.

```json
{
  "version": 0,
  "firstName": "Ada",
  "headline": "Product designer",
  "function": "Design",
  "specializations": ["Product design"],
  "skills": ["Research", "Prototyping", "Figma"],
  "industries": ["Health"],
  "locations": ["Lagos"],
  "remotePreference": "yes",
  "visibility": "anonymous",
  "hiddenEmployers": [],
  "hiddenFromAll": false,
  "currentStep": "visibility"
}
```

The response has this shape (other profile fields and timestamps are included):

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "firstName": "Ada",
    "function": "Design",
    "skills": ["Research", "Prototyping", "Figma"],
    "version": 1
  }
}
```

If another save or upload changes the profile first, the API returns `409 CONFLICT`. Fetch the profile again, reconcile changes, and retry with its new version. There is currently no ETag or `If-Match` support.

| Editable field | Validation |
| --- | --- |
| `firstName`, `function` | Trimmed strings, maximum 100 characters; empty strings allowed in drafts. |
| `headline`, `about` | Trimmed strings, maximum 150 and 600 characters respectively. |
| `specializations` | Up to 3 unique nonempty strings. |
| `skills`, `industries`, `locations` | Up to 50 unique nonempty strings each. |
| `hiddenEmployers` | Up to 100 unique nonempty strings. |
| All selection strings | Trimmed, 1–100 characters; duplicate checks are case-insensitive within each array. Values are currently free text, not catalog IDs. |
| `remotePreference` | `yes`, `no`, or `undecided`. |
| `visibility` | `anonymous` or `open`. |
| `hiddenFromAll` | Boolean. |
| `currentStep` | `account`, `import`, `profile`, `function`, `specializations`, `skills`, `industries`, `locations`, or `visibility`. |

`GET /candidates/me/onboarding` returns the current step, preliminary checklist, and missing keys:

```json
{
  "success": true,
  "data": {
    "currentStep": "account",
    "membershipRequirementsStatus": "undecided",
    "requirements": [
      { "key": "firstName", "complete": false },
      { "key": "function", "complete": false },
      { "key": "specializations", "complete": false },
      { "key": "skills", "complete": false },
      { "key": "industries", "complete": false },
      { "key": "locations", "complete": false }
    ],
    "missingRequirements": ["firstName", "function", "specializations", "skills", "industries", "locations"]
  }
}
```

The checklist checks for a name, function, one specialization, three skills, one industry, and either a location or `remotePreference: "yes"`. It does not prevent navigation or membership submission. Visibility settings are stored but are not yet enforced for employer discovery.

## Uploads

`POST /api/v1/candidates/me/assets` accepts multipart form data with `kind` (`photo` or `resume`) and `file`. Photos accept JPEG or PNG; resumes accept PDF. Maximum size is 5 MB. The returned asset ID is also attached to the candidate profile; uploading increments its version, so reload the profile before the next draft save.

`GET /api/v1/candidates/me/assets/{id}/download` returns an owner-only, five-minute Cloudinary download URL. Do not log or publicly share the URL. Files are uploaded as authenticated Cloudinary assets. Configure either `CLOUDINARY_URL`, or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`; the existing `cloud_name`, `cloud_key` and `cloud_secret` names are also supported. Set these in the deployed environment; do not commit values.

Example using a cookie jar saved by your login request:

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/v1/candidates/me/assets \
  -F "kind=resume" -F "file=@resume.pdf"
```

The port is an example; use the port configured for your server. A successful upload returns `201` and `{ "success": true, "data": { "id": "...", "kind": "resume", "contentType": "application/pdf", "size": 12345 } }`. A download response is `{ "success": true, "data": { "url": "...", "expiresIn": 300 } }`. Signature checks are based on file contents; setting a MIME type alone is insufficient.

The API checks file signatures and size but does not scan files for malware. Do not enable distribution of untrusted resumes to other users until a scanning workflow is in place. File replacement does not delete older uploaded assets; retention and deletion need implementation. Imports and text extraction are not implemented.

## Membership

`GET /api/v1/candidates/me/membership-application` returns the application or `null` and a requirements object with `status: "undecided"`. Profile requirements have not been agreed; no fields currently block submission. The onboarding checklist is preliminary and is not an admission policy.

`POST /api/v1/candidates/me/membership-application` submits for admin review. A second application for the same account returns 409. Resubmission after rejection is not yet supported.

Before submitting, a status response is:

```json
{
  "success": true,
  "data": {
    "application": null,
    "requirements": {
      "status": "undecided",
      "message": "Membership profile requirements have not been set yet"
    }
  }
}
```

Submitting returns `201` with a membership record whose status is `submitted` and source is `application`. Read the status endpoint again to see an admin decision. Current statuses are `submitted`, `accepted`, and `rejected`. The candidate status endpoint exposes the status, source and relevant dates, not the reviewer's identity.

`POST /api/v1/admin/referrals` creates a single-use referral code and returns it once. Protect the response. `POST /api/v1/candidates/me/referrals/redeem` accepts `{ "code": "..." }`; a valid unused code immediately accepts the candidate, including one with a pending or rejected application. Each code has no expiry until an expiry policy is chosen. Redemption uses a MongoDB transaction, so MongoDB must run as a replica set or sharded cluster with transaction support. Provision and verify unique indexes on membership `userId` and referral `codeHash` before serving traffic.

Admins use `GET /api/v1/admin/membership-applications` to list up to 100 pending submissions, `GET /api/v1/admin/membership-applications/{id}` to inspect an application and current profile, and `PATCH /api/v1/admin/membership-applications/{id}` with `{ "status": "accepted" }` or `{ "status": "rejected" }` to decide a pending application. The profile is live, not a frozen submission snapshot. Pagination, admin access to uploaded documents, decision history, and reviewer notes remain to be built.

Creating a referral returns `{ "success": true, "data": { "code": "..." } }` with status `201`. The code is only returned at creation. Redeem it with a JSON body such as `{ "code": "the-code-from-the-admin" }`; success returns the candidate's membership status. An invalid or used code returns 400, and an already accepted member receives 409. Redemption is limited to 10 requests per IP in 15 minutes by the current process-local limiter; use a shared limiter when running multiple instances.

An admin review request is:

```json
{ "status": "accepted" }
```

The review returns the updated record. An invalid ID, missing application, or application no longer in `submitted` state returns 404. A referral may accept a candidate with a pending application, so a later review can encounter that response.

## Errors

Errors use `{ "success": false, "code": "...", "message": "..." }`. Validation errors may also include a `details` array with `path` and `message`. Common statuses:

| Status | Meaning |
| --- | --- |
| 400 | Invalid request, validation failure, unsupported file contents, or invalid/used referral. |
| 401 | Missing, invalid, or expired session. |
| 403 | Unverified account or insufficient role. |
| 404 | Resource unavailable to the caller, invalid ID, or application already reviewed. |
| 409 | Stale profile version, duplicate application, or already accepted membership. |
| 413 / 415 | Request or file too large / unsupported request content type. |
| 429 | Rate limit reached; check `Retry-After`. |
| 500 / 503 | Server or service configuration failure. Server errors use a generic client-facing message. |

## Deployment and indexes

Configure `MONGODB_URI` or the existing environment-specific database URL, `JWT_SECRET`, email settings for account verification, and Cloudinary credentials on the running service. The database must be reachable from the deployment; `localhost` refers to the application host. Provision unique indexes on candidate profile `userId`, membership `userId`, and referral `codeHash`, and verify the existing unique user email index. Resolve duplicate records before creating unique indexes. Referral transactions require a replica set or sharded MongoDB cluster.

Membership status does not yet grant or restrict access elsewhere in the app. Employer-facing visibility enforcement and LinkedIn/resume parsing are also not implemented.
