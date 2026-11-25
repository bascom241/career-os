import User from "../model/user.model.ts";
import type { CreateUserInput, ForgotPasswordRequestInput } from "../schemas/user.schema.ts";
import { hashPassword } from "../../../utils/password.ts";
import type { IUser, LoginResponse, UserResponse } from "../types/user.types.ts";
import { createVerificationToken } from "../../../utils/createVerificationToken.ts";
import type { LoginUserInput } from "../schemas/user.schema.ts";
import { verifyPassword } from "../../../utils/password.ts";
import { AppError } from "../../../shared/errors/AppError.ts";
import { InvalidCredentials } from "../../../shared/errors/HttpErrors.ts";
import { sendTransactionalEmail } from "../../../mail/brevo/service/transactional.service.ts";
import { sendResetPasswordToken, verifyEmailTemplate } from "../../../mail/brevo/templates/emailVerificationTemplate.template.ts";
import type{ VerifyEmailInput } from "../schemas/user.schema.ts";
import crypto from "crypto";
import type { ResetPasswordInput } from "../schemas/user.schema.ts";
import { hashedOtp } from "../../../utils/otp.ts";


export function publicUser(user: { _id: { toString(): string }; fullName: string; email: string; role: string; roles?: string[]; isEmailVerified?: boolean }) {
    return { id: user._id.toString(), fullName: user.fullName, email: user.email, role: user.role, roles: user.roles?.length ? user.roles : [user.role], isEmailVerified: user.isEmailVerified ?? false, entitlements: [] as string[] };
}

export const registerUser = async (data: CreateUserInput): Promise<UserResponse | undefined> => {
    const { fullName, email, password, role, consent } = data;
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
        return undefined
    }
    const hashedPassword = await hashPassword(password);
    const { token, expiresAt } = createVerificationToken();
    const newUser: IUser = {
        fullName,
        email,
        role,
        roles: [role],
        consentRecords: [{ termsVersion: consent.termsVersion, privacyVersion: consent.privacyVersion, acceptedAt: new Date() }],
        password: hashedPassword,
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt ? expiresAt.toString() : ""
    }
    let user;
    try { user = await User.create(newUser); } catch (error) { if ((error as { code?: number }).code === 11000) return undefined; throw error; }
    const delivery = await sendTransactionalEmail({ toEmail: email, toName: fullName, emailSubject: "Verify your email", htmlContent: verifyEmailTemplate(fullName, token) });
    if (!delivery.success) { await User.deleteOne({ _id: user._id }); console.error("Registration verification email delivery failed"); return undefined; }
    if (!user) {
        throw new Error("failed to create user")
    }
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email
    }
}



export const loginUser = async (data: LoginUserInput): Promise<LoginResponse> => {
    const { email, password } = data
    const user = await User.findOne({ email });
    if (!user) {
        throw new InvalidCredentials()
    }
    const isPasswordCorrect = await verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
        throw new InvalidCredentials()
    }
    if (!user.isEmailVerified) throw new AppError("Verify your email before signing in", 403);
    return { id: user._id.toString(), tokenVersion: user.tokenVersion ?? 0, user: publicUser(user) };
}


export const verifyEmail = async (data: VerifyEmailInput): Promise<void> => {
    const {code, email} = data;
    const user = await User.findOne({email, verificationToken: code}); 

    const expiresAt = user?.verificationTokenExpiresAt ? new Date(user.verificationTokenExpiresAt).getTime() : NaN;
    if(!user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()){
        throw new AppError("Invalid or expired verification code", 400)
    }

    if(user.isEmailVerified){
        throw new AppError("email already verified", 400)
    }

    user.isEmailVerified = true; 
    user.verificationToken = "";
    user.verificationTokenExpiresAt = "";
    await user.save() 
}


export const forgotPassword = async (data: ForgotPasswordRequestInput) : Promise<void> => {

    const {email} = data
    const user = await User.findOne({email}); 
    if(!user) return;


    const {otp, hashOtp} = await hashedOtp(); 
    const {expiresAt} = createVerificationToken();

    user.resetPasswordTokenHashed = hashOtp; 
    user.resetPasswordTokenExpiresAt = expiresAt ? expiresAt.toString() : ""; 
    user. resetPasswordCount =  0; 


    user.passwordResetTokenHashed = ""; 
    user.passwordResetTokenExpiresAt = "";

    await user.save();
    const delivery = await sendTransactionalEmail({toEmail: email, toName: user.fullName, emailSubject: "Reset your password", htmlContent:sendResetPasswordToken(user.fullName,otp )});
    if (!delivery.success) { console.error("Password reset email delivery failed"); }

}
export const resetPassword = async ({ email, code, password }: ResetPasswordInput): Promise<void> => {
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new AppError("OTP secret is not configured", 500);
    const user = await User.findOne({ email });
    const invalid = () => new AppError("Invalid or expired reset code", 400);
    const expiresAt = user?.resetPasswordTokenExpiresAt ? new Date(user.resetPasswordTokenExpiresAt).getTime() : NaN;
    if (!user || !user.resetPasswordTokenHashed || !user.resetPasswordTokenExpiresAt || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || Number(user.resetPasswordCount ?? 0) >= 5) throw invalid();
    const hash = crypto.createHmac("sha256", secret).update(code).digest("hex");
    if (hash !== user.resetPasswordTokenHashed) {
        await User.updateOne({ _id: user._id, resetPasswordTokenHashed: user.resetPasswordTokenHashed, resetPasswordTokenExpiresAt: user.resetPasswordTokenExpiresAt }, { $inc: { resetPasswordCount: 1 } });
        throw invalid();
    }
    const passwordHash = await hashPassword(password);
    if (expiresAt <= Date.now()) throw invalid();
    const updated = await User.updateOne(
        { _id: user._id, resetPasswordTokenHashed: user.resetPasswordTokenHashed, resetPasswordTokenExpiresAt: user.resetPasswordTokenExpiresAt, resetPasswordCount: { $lt: 5 } },
        { $set: { password: passwordHash, resetPasswordTokenHashed: "", resetPasswordTokenExpiresAt: "", resetPasswordCount: 0 }, $inc: { tokenVersion: 1 } }
    );
    if (!updated.modifiedCount) throw invalid();
}

export const resendVerification = async (email: string): Promise<void> => {
    const user = await User.findOne({ email });
    if (!user || user.isEmailVerified) return;
    const { token, expiresAt } = createVerificationToken();
    user.verificationToken = token;
    user.verificationTokenExpiresAt = expiresAt?.toString() ?? "";
    await user.save();
    const delivery = await sendTransactionalEmail({ toEmail: user.email, toName: user.fullName, emailSubject: "Verify your email", htmlContent: verifyEmailTemplate(user.fullName, token) });
    if (!delivery.success) console.error("Verification email delivery failed");
};
