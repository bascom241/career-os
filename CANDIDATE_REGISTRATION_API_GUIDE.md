# Candidate registration and onboarding API guide

This guide translates the supplied candidate-flow screens into a proposed backend implementation. It is a design for work to build, not a description of endpoints that already exist. The screenshots do not show every step or business rule; decisions marked **proposed** need product confirmation before they become contractual behavior.

## 1. What the flow needs to achieve

1. Register and verify an account, then authenticate the candidate.
2. Save onboarding answers as a draft as the candidate moves between steps, leaves, or returns on another device.
3. Optionally import a LinkedIn profile or resume, with explicit consent, and let the candidate review imported information.
4. Collect identity, job function, up to three specializations, at least three skills, industries, work locations and remote preference, and visibility preferences.
5. Show profile requirements and progress, accept a referral code, and allow an eligible candidate to submit a membership application.
6. Show membership and job-application statuses separately. Being registered, completing a profile, and being accepted into the network are different states.

The images also mention salary expectations, deal-breakers and a target role, but do not show their full forms. The screens show an assistant and a count of relevant open roles; these need separate product specifications and must not be represented as working features until matching and messaging exist. Do not infer that the displayed step numbers or progress are authoritative: the screenshots contain repeated and inconsistent numbers.

## 2. Existing code and integration points

- Express, TypeScript, Mongoose and Zod are already in use. Routes are mounted in `src/app.ts`; authentication lives under `/api/v1/auth` and `GET /api/v1/users/me`.
- Existing account endpoints include `POST /auth/register`, `/verify`, `/login`, `/logout`, and `GET /auth/me`, relative to `/api/v1`. Registration currently requires `fullName`, `email`, `password`, `role` and accepted terms/privacy versions. Verification does not itself log the user in; the client must log in to obtain the session cookie.
- `authenticate` checks the HTTP-only JWT cookie, token version and verified email. Apply it to candidate endpoints, then enforce candidate authorization and ownership on the server. Inspect `requireRole` and the account's `roles` behavior before relying on it.
- Keep credentials and account identity in `User`; put the evolving candidate profile in a separate collection keyed by user ID. Reuse the current validation and error middleware and extend `src/docs/openapi.ts` as endpoints are implemented.
- The app currently rejects non-JSON POST/PUT/PATCH requests globally in `src/app.ts`. Resume and photo upload cannot use multipart until that guard is scoped or upload routes are mounted with a dedicated parser. Direct-to-object-storage uploads are another option.
- `connectDb.ts` checks for a unique email index and still refers to the removed email migration. Plan an independently reviewed index provisioning procedure and update the stale message before deployment; don't silently recreate or run the removed script.

## 3. Proposed data model

Use MongoDB `ObjectId` references and timestamps; examples use readable IDs. Never accept a candidate's owner ID from the request body. Add a unique index on `candidateProfiles.userId` through an explicit deployment migration.

### CandidateProfile

| Field | Purpose |
| --- | --- |
| `userId` | Unique account reference. |
| `firstName`, `headline`, `about`, `photoAssetId` | Display name and optional profile details. Keep `User.fullName` separate unless a product decision defines synchronization. |
| `functionId`, `specializationIds` | One job function and 1–3 specializations; support an explicitly modeled custom role if needed. |
| `skillIds`, `customSkills` | At least three distinct skills for submission; free-text skills need normalization and moderation. |
| `industryIds` | Candidate's selected industries. |
| `locationIds`, `remotePreference` | Cities and explicit remote choice; store stable IDs and remote scope, not only display text. |
| `targetRole`, `salaryExpectation`, `dealBreakers`, `linkedinUrl`, `resumeAssetId` | Additional requirements shown on the overview. Define salary currency, period, minimum/maximum and location context before implementation. |
| `visibility` | `anonymous` or `open`; hidden employer IDs; `hiddenFromAll` flag. Default anonymous. |
| `onboarding` | Current step, last saved timestamp and schema version. Compute completion from profile data; do not trust a client-supplied percentage. |

Store file metadata in an `Asset` record: owner, type, private storage key, content type, byte size, scan status and timestamps. Keep files in private object storage, not MongoDB documents or public URLs. Reference only assets owned by the candidate and verified as ready.

Use versioned reference data for functions, specializations, skills, industries, cities and employers. IDs remain stable when labels change. Associate specializations with functions and suggested skills with specializations. Decide how custom options are reviewed and merged.

### Separate workflow records

- `ImportJob`: owner, source (`resume` or `linkedin`), consent record/version, status (`queued`, `processing`, `completed`, `failed`), safe error code and timestamps. Keep extracted fields in a reviewable draft with provenance; never overwrite candidate edits automatically. Set retention and deletion policies for raw source and extracted data.
- `ReferralRedemption`: code reference, candidate ID, status and timestamps. Keep referral eligibility, expiry, usage limits and whether redemption grants admission as explicit product rules; apply atomically and do not expose who owns a code.
- `MembershipApplication`: owner, profile snapshot/version, status and status history, submitted/decided timestamps and reviewer notes separated into candidate-visible and internal fields. Proposed statuses: `submitted`, `under_review`, `accepted`, `rejected`, `withdrawn`. No application exists until submitted; a queue screen alone is not evidence of submission.
- `JobApplication`: candidate, job, status and candidate-visible status history, separate from membership applications. Define allowed transitions with the recruiting workflow.

Index ownership and lookup fields, plus application status/timestamps where needed. Enforce one profile per user, prevent duplicate active membership submissions, and use a unique candidate/job constraint if only one application per job is allowed. Create indexes explicitly for production because the current user schema disables `autoIndex`.

## 4. API conventions

All proposed paths below begin with `/api/v1`; all candidate-specific endpoints require the authenticated, verified candidate. Use `res.locals.user.id` for ownership and return only authorized fields. Existing auth responses use `{ success, data/message }`; use the same envelope for new APIs. Example errors: `{ "success": false, "message": "Validation failed", "errors": [{ "field": "firstName", "code": "required" }] }`. The structured `errors` array is proposed and requires an error-handler update. Use 400 for malformed input, 401 for missing/invalid session, 403 for insufficient permission, 404 for inaccessible resources, 409 for state conflicts, 413 for oversized uploads, 415 for unsupported media type, 422 for valid syntax that fails business rules, and 429 for rate limits. Keep responses consistent with the implemented middleware.

`PATCH` should update only supplied fields; omitted fields stay unchanged and explicit `null` clears nullable fields. Validate nested fields and reject unknown keys. Use a profile version with `If-Match`/ETag or an equivalent optimistic-concurrency check so simultaneous tabs cannot silently overwrite one another. Return 409 on a stale version, with an instruction to reload. Save each accepted update atomically. Never allow clients to set approval status, progress, file scan status or ownership.

## 5. Endpoint inventory

| Method and path | Purpose and important rules |
| --- | --- |
| `GET /candidates/me/profile` | Return saved draft, profile version and onboarding progress; create an empty draft lazily or on registration, consistently. |
| `PATCH /candidates/me/profile` | Autosave editable fields. Permit incomplete drafts; validate individual field formats and ownership. Return updated profile/version. |
| `GET /candidates/me/onboarding` | Return current step, server-computed checklist, missing requirements, completion state and application eligibility. |
| `PATCH /candidates/me/onboarding` | Save the last visited step only; validate against known steps. Skipping and saving never imply completion. |
| `GET /reference-data` | Return versioned functions, industries and locations, or split into paginated endpoints as the catalog grows. |
| `GET /reference-data/functions/{id}/specializations` | Return specializations for the chosen function. |
| `GET /reference-data/skills?specializationIds=...` | Return suggested skills and searchable alternatives; suggestions are not verified skills. |
| `GET /reference-data/employers?q=...` | Search employers for exclusion, with pagination and rate limiting. |
| `POST /candidates/me/assets` | Initiate photo or resume upload; validate type/size and owner. Return a short-lived upload target if using object storage. |
| `POST /candidates/me/assets/{assetId}/complete` | Confirm uploaded object, verify size/type, queue malware scanning and mark ready only after checks. |
| `DELETE /candidates/me/assets/{assetId}` | Remove a candidate-owned asset and its references, subject to defined retention rules. |
| `POST /candidates/me/imports` | Start optional import after explicit consent; return `202` and job ID. |
| `GET /candidates/me/imports/{id}` | Poll owned job status and preview extracted fields. |
| `POST /candidates/me/imports/{id}/apply` | Apply selected fields with version check; preserve manual edits and report conflicts. |
| `POST /candidates/me/referrals/redeem` | Validate and atomically redeem a code; return resulting eligibility without leaking code details. |
| `GET /candidates/me/membership-application` | Return own application and candidate-visible history, or `data: null` when none exists. |
| `POST /candidates/me/membership-application` | Recompute requirements and submit once eligible; return `201` or `409` for an existing active application. |
| `GET /candidates/me/job-applications` | Paginated candidate-owned job applications and visible history. |
| `GET /jobs` | Browse open roles with pagination and filters; separate from onboarding and admission rules. |

If a matching service is built, add `GET /candidates/me/job-matches` with a documented count and eligibility rules. Do not hardcode the screen's example count. Add job-application creation only after deciding whether nonmembers may apply and defining the job workflow.

## 6. Example contracts

Draft save (the client sends the version it last read):

```http
PATCH /api/v1/candidates/me/profile
Content-Type: application/json
If-Match: "3"

{
  "firstName": "Farzana",
  "headline": "Product designer",
  "functionId": "design",
  "specializationIds": ["product-design", "visual-design"],
  "skillIds": ["figma", "visual-design", "prototyping"]
}
```

```json
{ "success": true, "data": { "version": 4, "savedAt": "2026-01-01T12:00:00Z" } }
```

Return the new ETag as well. A real implementation should return the normalized updated profile or make the follow-up read explicit.

Checklist response (illustrative rules, not approved product policy):

```json
{
  "success": true,
  "data": {
    "currentStep": "visibility",
    "complete": false,
    "requirements": [
      { "key": "firstName", "complete": true },
      { "key": "skills", "complete": true },
      { "key": "resume", "complete": false }
    ],
    "missingRequirements": ["resume"],
    "canSubmitMembershipApplication": false
  }
}
```

The overview marks some items required while individual screens call import, photo and LinkedIn optional or describe the resume as required. Resolve that distinction in a single server-side requirements policy, including whether manual entry can substitute for an import. Keep account setup completion and application readiness separate. A resume upload and a LinkedIn import are distinct; neither should be silently treated as consent to the other.

Example import request:

```json
{
  "source": "resume",
  "assetId": "asset_id",
  "consent": { "accepted": true, "version": "profile-import-v1" }
}
```

For LinkedIn use `source: "linkedin"` plus `profileUrl` only if an authorized provider and permitted access method are available. A URL and user consent alone do not establish permission or technical access to scrape a profile. If there is no authorized integration, disable that option and offer manual entry/resume upload. Validate URLs, prevent server-side request forgery, and never fetch arbitrary user-supplied URLs.

## 7. Validation and behavior by screen

| Screen | Backend behavior |
| --- | --- |
| Welcome/checklist and referral | Return server-computed checklist and apply code through the dedicated endpoint. Record consent separately from referral redemption. |
| Import | Optional; require source-specific consent, a candidate-owned ready resume or supported LinkedIn integration. Asynchronous job, retry-safe processing, status polling and review before applying. |
| Name and profile | Require a trimmed first name to advance from that step; optional photo, headline and about. About screen shows a 600-character limit. Validate file MIME and actual content; screenshots mention a 5 MB photo limit, which should be confirmed. |
| Function | Require one valid function to proceed. Changing function must invalidate or revalidate incompatible specializations without silently deleting other answers. |
| Specializations | Require 1–3 valid selections within the chosen function; handle the custom-role path explicitly. |
| Skills | Require at least three unique skills for the step; allow suggestions and a controlled custom option. Verification by a former manager is a future workflow, not automatic. |
| Industries | At least one is suggested by the screen; confirm whether this is a submission requirement. |
| Locations | At least one location or an affirmative remote choice as shown; define remote scope and any work-authorization fields separately. |
| Visibility | Default anonymous; support open and hidden-from-all. Employer exclusions must be enforced at every employer-facing read/search/export, not merely hidden in the UI. |
| Queue and applications | Show actual membership status and appropriate actions. `Save & exit` persists the draft; `Apply to join` explicitly submits. Return job applications independently. |

Store partial drafts even when a step is incomplete; validate step advancement and final submission separately. Completion and eligibility must be calculated using one shared policy so the checklist and submit endpoint cannot disagree. Show field-level reasons for blocked submission.

## 8. Privacy, access and operations

- Define employer-facing DTOs separately from candidate self-service responses. In anonymous mode remove name, photo, contact details, LinkedIn URL, resume and other identifying fields from every employer-facing API, search index, export and notification until an explicit reveal event permitted by product policy. Free-text and inferred identifiers can still identify people; define redaction/review and avoid promising perfect anonymity. The screenshot suggests revealing identity after a reply; confirm precisely which reply and consent triggers it.
- When `hiddenFromAll` is true, exclude the profile from employer discovery; candidate-initiated applications may need a separate exception, which must be specified and tested. Exclusions must cover the selected employer across search, recommendations, profile reads and notifications.
- Use cookie-aware CSRF protection and a deliberate CORS/origin policy for state-changing browser requests. Do not trust a user ID or role in client input. Limit access to private assets via short-lived authorized downloads; validate uploads, scan before use, and rate-limit expensive endpoints.
- Record consent text/version, purpose and timestamp. Provide consent withdrawal, deletion and retention behavior for uploads, imports and application snapshots; define what can be retained and who may access it. Avoid sensitive profile data, tokens and file contents in logs.
- Make import and submission retries idempotent, especially referral redemption and job processing. Use transactions or conditional writes where multiple records must change together. Track audit events without exposing internal reviewer notes to candidates.

## 9. Suggested implementation order and checks

1. Agree on the missing product rules: required fields, acceptance/referral policy, visibility reveal, allowed application states, and LinkedIn access. Define the reference catalog and IDs.
2. Add candidate profile and reference-data models, indexes, authenticated routes, Zod schemas and OpenAPI documentation. Implement draft saves, concurrency, checklist and resume-on-return first.
3. Implement visibility filtering as a shared server-side policy before any employer-facing discovery exists. Add candidate-owned private asset storage and upload processing.
4. Add consented asynchronous resume import and review; add LinkedIn only with an authorized integration. Add referrals and membership submissions with atomic, idempotent transitions.
5. Add job browsing and application tracking when their domain models and access rules are defined. Add matching and assistant functionality as separate features.

Verify with integration tests against a test database: registration/verification/login; candidate ownership and role checks; partial autosave, reload and concurrent edits; each step's limits and final checklist; changing function; valid and invalid referral redemption under concurrent requests; submission retries; private file ownership, size/type/scan and consent; import failure and manual-edit conflicts; visibility and employer exclusion across all delivery paths; and independent membership/job application statuses. Test upload handling against the global JSON guard and verify indexes are provisioned on a clean deployment.
