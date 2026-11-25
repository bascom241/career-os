import type { Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError.ts";
export function errorHandler(err: Error & { type?: string; status?: number }, res: Response) {
    let status = 500; let code = "INTERNAL_ERROR"; let message = "Internal server error"; let details: object[] | undefined;
    if (err instanceof ZodError) { status = 400; code = "VALIDATION_ERROR"; message = "Invalid request"; details = err.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })); }
    else if ((err as Error & { code?: string }).code === "LIMIT_FILE_SIZE") { status = 413; code = "PAYLOAD_TOO_LARGE"; message = "File is too large"; }
    else if (err.name === "MulterError") { status = 400; code = "VALIDATION_ERROR"; message = "Invalid upload"; }
    else if (err.message === "Unexpected end of form" || err.message === "Multipart: Boundary not found") { status = 400; code = "BAD_REQUEST"; message = "Malformed multipart upload"; }
    else if (err.type === "entity.parse.failed") { status = 400; code = "INVALID_JSON"; message = "Malformed JSON body"; }
    else if (err.type === "entity.too.large") { status = 413; code = "PAYLOAD_TOO_LARGE"; message = "Request body is too large"; }
    else if (err.type === "charset.unsupported" || err.type === "encoding.unsupported") { status = 415; code = "UNSUPPORTED_MEDIA_TYPE"; message = "Unsupported request encoding"; }
    else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" || err.name === "NotBeforeError") { status = 401; code = "UNAUTHENTICATED"; message = "Invalid or expired session"; }
    else if (err instanceof AppError) { status = err.statusCode; code = ({400:"BAD_REQUEST",401:"UNAUTHENTICATED",403:"FORBIDDEN",404:"NOT_FOUND",409:"CONFLICT",413:"PAYLOAD_TOO_LARGE",415:"UNSUPPORTED_MEDIA_TYPE",429:"RATE_LIMITED",503:"SERVICE_UNAVAILABLE"} as Record<number,string>)[status] ?? "INTERNAL_ERROR"; message = status >= 500 ? "Internal server error" : err.message; }
    if (status >= 500) console.error("[API error]", err);
    return res.status(status).json({ success: false, code, message, ...(details ? { details } : {}) });
}
