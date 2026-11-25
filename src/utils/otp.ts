import crypto from "crypto"
import { createVerificationToken } from "./createVerificationToken.ts"
import { AppError } from "../shared/errors/AppError.ts";


interface HashedOtp {
    otp: string
    hashOtp: string
}
export async function hashedOtp (): Promise<HashedOtp> {
    const {token} = createVerificationToken();

    const secret = process.env.OTP_SECRET; 

    if(!secret){
        throw new AppError(process.env.NODE_ENV === "production" ? "internal server error": "otp env not found")
    }
    return {
        otp: token,
        hashOtp: crypto.createHmac("sha256", secret).update(token).digest("hex")
    
    }
}
