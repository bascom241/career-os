import { z } from "zod"
import { createUserSchema, forgotPasswordSchema, loginUserSchema } from "../auth/schemas/user.schema.ts"

// Keep request constraints in the validators; OpenAPI renders those same schemas.
const requestSchema = (schema: typeof createUserSchema.shape.body | typeof loginUserSchema.shape.body | typeof forgotPasswordSchema.shape.body) =>
    z.toJSONSchema(schema, { target: "draft-2020-12", io: "input" })

const jsonResponse = (description: string, schema: object, example: object) => ({
    description,
    content: { "application/json": { schema, example } },
})

const errorSchema = { $ref: "#/components/schemas/Error" }
const validationResponse = jsonResponse("Request validation failed.", { $ref: "#/components/schemas/ValidationError" }, {
    success: false, errors: [{ path: "body.email", message: "Invalid email address" }],
})
const serverErrorResponse = jsonResponse("An unexpected server error occurred.", errorSchema, {
    success: false, message: "Internal server error",
})
const cookieHeader = {
    description: "Sets the HTTP-only jwt cookie, valid for seven days. The Secure flag is set in production.",
    schema: { type: "string", example: "jwt=<token>; Max-Age=604800; HttpOnly" },
}

export const openapi = {
    openapi: "3.1.0",
    info: {
        title: "Career OS API",
        version: "1.0.0",
        description: "API reference for Career OS. Successful registration and login set an HTTP-only JWT cookie. Registration sends an email verification message.",
    },
    servers: [{ url: "/", description: "Current server" }],
    tags: [{ name: "Authentication", description: "Register and log in to an account." }],
    paths: {
        "/api/v1/auth/register": {
            post: {
                tags: ["Authentication"], operationId: "register", summary: "Register an account",
                description: "Creates a candidate or employer account, sends a verification email, and sets a JWT cookie. The admin role is rejected. The verification token is not returned in the response.",
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" }, example: { fullName: "Alex Morgan", email: "alex@example.com", password: "example-password", role: "candidate" } } } },
                responses: {
                    "201": { ...jsonResponse("Account created.", { $ref: "#/components/schemas/RegisterResponse" }, { success: true, message: "user created successfully", data: { id: "507f1f77bcf86cd799439011", fullName: "Alex Morgan", email: "alex@example.com" } }), headers: { "Set-Cookie": cookieHeader } },
                    "400": validationResponse,
                    "404": jsonResponse("The admin role cannot be set during registration.", errorSchema, { success: false, message: "admin role cannot be set" }),
                    "409": jsonResponse("An account with this email already exists.", errorSchema, { success: false, message: "user already exist" }),
                    "500": serverErrorResponse,
                },
            },
        },
        "/api/v1/auth/login": {
            post: {
                tags: ["Authentication"], operationId: "login", summary: "Log in",
                description: "Authenticates an account and sets a JWT cookie. No user data is returned in the response body.",
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" }, example: { email: "alex@example.com", password: "example-password" } } } },
                responses: {
                    "200": { ...jsonResponse("Login successful.", { $ref: "#/components/schemas/LoginResponse" }, { success: true, message: "login successfully" }), headers: { "Set-Cookie": cookieHeader } },
                    "400": validationResponse,
                    "401": jsonResponse("The account does not exist or the password is incorrect.", errorSchema, { success: false, message: "invalid password provided" }),
                    "500": serverErrorResponse,
                },
            },
        },
        "/api/v1/auth/forgot-password": {
            post: {
                tags: ["Authentication"], operationId: "forgotPassword", summary: "Request a password reset code",
                description: "Sends a password reset code by email if an account exists for the supplied address. The response does not disclose whether the account exists.",
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" }, example: { email: "alex@example.com" } } } },
                responses: {
                    "200": jsonResponse("Password reset request accepted.", { $ref: "#/components/schemas/ForgotPasswordResponse" }, { success: true, message: "If the email exists, a password reset code has been sent." }),
                    "400": validationResponse,
                    "500": serverErrorResponse,
                },
            },
        },
    },
    components: {
        schemas: {
            RegisterRequest: requestSchema(createUserSchema.shape.body),
            LoginRequest: requestSchema(loginUserSchema.shape.body),
            ForgotPasswordRequest: requestSchema(forgotPasswordSchema.shape.body),
            RegisterResponse: {
                type: "object", required: ["success", "message", "data"], properties: {
                    success: { type: "boolean", const: true }, message: { type: "string" },
                    data: { type: "object", required: ["id", "fullName", "email"], properties: { id: { type: "string" }, fullName: { type: "string" }, email: { type: "string", format: "email" } } },
                },
            },
            LoginResponse: { type: "object", required: ["success", "message"], properties: { success: { type: "boolean", const: true }, message: { type: "string" } } },
            ForgotPasswordResponse: { type: "object", required: ["success", "message"], properties: { success: { type: "boolean", const: true }, message: { type: "string" } } },
            Error: { type: "object", required: ["success", "message"], properties: { success: { type: "boolean", const: false }, message: { type: "string" } } },
            ValidationError: { type: "object", required: ["success", "errors"], properties: { success: { type: "boolean", const: false }, errors: { type: "array", items: { type: "object", required: ["path", "message"], properties: { path: { type: "string" }, message: { type: "string" } } } } } },
        },
        securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "jwt", description: "JWT cookie issued by registration or login." } },
    },
}
