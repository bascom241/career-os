import type { Response, Request } from "express";
import type{ NextFunction } from "express";
import type { CreateUserInput, ForgotPasswordRequestInput, LoginUserInput, VerifyEmailInput } from "../schemas/user.schema.ts";
import { generateTokenAndSetCookie } from "../../utils/generateToken.ts";
import User from "../model/user.model.ts";
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword, resendVerification } from "../service/auth.service.ts";


export async function register (req: Request, res: Response, next: NextFunction) {
    try{
        await registerUser(req.body);
        res.status(202).json({ success: true, message: "If registration can be completed, check your email for a verification code." });
    }catch(error: any){
        next(error)
    }
} 

export async function login (req:Request , res:Response, next: NextFunction) {
    try {
        const {email, password} = req.body;
        const dataToSend: LoginUserInput = {
            email, 
            password
        }
        const data = await loginUser(dataToSend); 
        const {id, tokenVersion} = data; 
        generateTokenAndSetCookie(res, id, tokenVersion); 
        res.status(200).json({success: true, message: "login successfully", data: data.user})
    } catch (error) {
        next(error)
    }
}


export async function verify(req: Request, res: Response, next:NextFunction) {
    try{
        const {code, email} = req.body; 
        const dataToSend: VerifyEmailInput = {
            code, email
        }; 

        await verifyEmail(dataToSend);
        res.status(200).json({success: true, message: "email verified successfully"})
    }catch(error){
        next(error)
    }
}

export async function forgot (req: Request, res: Response, next:NextFunction) {
    try{
        const {email} = req.body; 
        
        const dataToSend: ForgotPasswordRequestInput = {
            email
        }
        await forgotPassword(dataToSend); 
        res.status(200).json({success: true, message: "If the email exists, a password reset code has been sent."})
    }catch(err){
        next(err)
    }
}
export async function reset(req: Request, res: Response, next: NextFunction) {
    try { await resetPassword(req.body); res.json({ success: true, message: "Password reset successfully" }); } catch (error) { next(error); }
}
export async function logout(_req: Request, res: Response, next: NextFunction) {
    try {
        await User.updateOne({ _id: res.locals.user.id }, { $inc: { tokenVersion: 1 } });
        res.clearCookie("jwt", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
        res.json({ success: true, message: "Logged out successfully" });
    } catch (error) { next(error); }
}

export function currentUser(_req: Request, res: Response) {
    res.json({ success: true, data: res.locals.user });
}

export async function resendVerify(_req: Request, res: Response, next: NextFunction) {
    try {
        await resendVerification(_req.body.email);
        res.json({ success: true, message: "If the account needs verification, a code has been sent." });
    } catch (error) { next(error); }
}

export function refresh(_req: Request, res: Response) {
    generateTokenAndSetCookie(res, res.locals.user.id, res.locals.tokenVersion);
    res.json({ success: true, data: res.locals.user });
}
