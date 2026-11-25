# Career OS API

Express and MongoDB backend for authentication, candidate profiles, uploads and membership applications.

## Run locally

Install dependencies with `npm install`, configure the environment, and run `npm run dev`. The default port is 3000; `PORT` overrides it. Production startup uses `npm start`. This project runs TypeScript directly with Node; use a Node version that supports its TypeScript syntax. `npm run typecheck` runs the TypeScript compiler, and `npm test` runs the existing tests.

The server loads environment variables using dotenv. Relevant settings include:

| Variable | Use |
| --- | --- |
| `MONGODB_URI` | Database connection string; takes precedence over the environment-specific settings below. |
| `mongo_url` / `live_mongo_url` | Fallback database URI for non-production / production respectively. |
| `NODE_ENV` | `production` selects `live_mongo_url` when `MONGODB_URI` is absent and enables secure session cookies. |
| `JWT_SECRET` | Signs and verifies session cookies. |
| `BREVO_KEY`, `BREVO_SENDER_NAME`, `BREVO_SENDER_MAIL` | Verification and password-reset email delivery. |
| `OTP_SECRET` | Protects password-reset codes. |
| `CLOUDINARY_URL` | Cloudinary connection URL, or use the separate variables described in the candidate API guide. |
| `PORT` | HTTP port; defaults to `3000`. |
| `TRUST_PROXY` | Optional comma-separated proxy IPs or CIDRs controlled by the deployment. |

Use a MongoDB instance reachable by the server. Referral redemption requires transaction support on a replica set or sharded cluster. Do not commit environment values or credentials.

## Documentation

- Interactive OpenAPI reference: `/docs`; machine-readable specification: `/openapi.json`.
- [API testing examples](API_TESTING.md) gives sample requests and responses for every implemented endpoint.
- [Candidate profile, uploads and membership API](CANDIDATE_MEMBERSHIP_API.md) describes implemented behavior, examples and known limitations.
- [Candidate registration implementation guide](CANDIDATE_REGISTRATION_API_GUIDE.md) is a planning document. Its proposed contracts are not all implemented; use the candidate API guide and OpenAPI for the current contract.

## Structure

Features live under `src/features`, with routes, controllers, services, schemas and models grouped by domain. Authentication is in `auth`, profile and upload handling in `candidate`, and referrals and membership review in `membership`. Shared middleware and error handling are under `src/middlewares` and `src/shared`.
