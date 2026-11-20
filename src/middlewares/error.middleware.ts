import type{ NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/AppError.ts";
import { UserAlreadyExistError } from "../shared/errors/HttpErrors.ts";


export function errorHandler (err: Error,res: Response ) {


    if(err instanceof AppError){
        return res.status(err.statusCode)
        .json({success: false, message: err.message})
    }

    if(err instanceof UserAlreadyExistError){
         return res.status(err.statusCode)
        .json({success: false, message: err.message})
    }

    if(err.name === "JsonWebTokenError" || err.name === "TokenExpiredError"){
        return res.status(401)
        .json({success: false , message:"Invalid or Expired token"})
    }


    return res.status(500).json({
        success: false, 
        message: process.env.NODE_ENV==="production" ? "Internal server error" : err.message
    })



}