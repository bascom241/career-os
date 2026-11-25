import type { ZodObject } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
export function validate(schema: ZodObject) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try { const parsed = await schema.parseAsync({ body: req.body }); req.body = parsed.body; next(); }
        catch (error) { next(error); }
    };
}
