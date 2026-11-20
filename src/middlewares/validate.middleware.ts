import type { ZodObject } from "zod";
import type{ Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function validate (schema: ZodObject) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try{
            await schema.parseAsync({
                body:req.body, 
                params: req.params, 
                query: req.body
            })

            next()
        }catch (error: any){
            if(error instanceof ZodError){
                res.status(400).json({
                    success: false, 
                    errors: error.issues.map((err)=> ({
                        path: err.path.join("."), 
                        message: err.message
                    }))
                });
                return 
            }
            res.status(500).json({
                success: false, 
                message:"Internal server error"
            })
        }
    }
}