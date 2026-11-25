import { type Response } from "express";
import jwt from "jsonwebtoken"

export const generateTokenAndSetCookie = (res: Response, userId: string, tokenVersion: number = 0):void => {

    const secret = process.env.JWT_SECRET; 
    if(!secret){
        throw new Error("env not configured")
    }
    const token = jwt.sign({userId, tokenVersion}, secret, {
        expiresIn:"7d"
    });

    res.cookie("jwt", token, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite:"lax", 
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
} 