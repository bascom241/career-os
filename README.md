# Career OS API

## API documentation

Install dependencies with `npm install` and start the API with `npm run dev` (or `npm start`). With the server running, open `/docs` for the interactive Scalar reference and `/openapi.json` for the OpenAPI 3.1 document. For example, with the default port, visit `http://localhost:3000/docs`.

The API needs its existing database, JWT, and email configuration for authentication requests. The documentation routes do not require authentication. Scalar's interactive interface loads its client from a CDN by default, so the browser needs network access.

The OpenAPI definition is in `src/docs/openapi.ts`. Request schemas are generated from the Zod validators in `src/auth/schemas/user.schema.ts`. When adding or changing an endpoint, update its operation, response schemas, examples, and security requirements in the OpenAPI definition, and check that they match the running API. Keep credentials and real tokens out of examples.
