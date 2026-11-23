import { UserAlreadyExistError } from "../../shared/errors/HttpErrors.ts";
import User from "../model/user.model.ts";
import type { CreateUserInput, ForgotPasswordRequestInput } from "../schemas/user.schema.ts";
import { hashPassword } from "../../utils/password.ts";
import type { IUser, LoginResponse, UserResponse } from "../types/user.types.ts";
import { createVericationToken } from "../../utils/createVerifyToken.ts";
import type { LoginUserInput } from "../schemas/user.schema.ts";
import { UserNotExistError } from "../../shared/errors/HttpErrors.ts";
import { verifyPassword } from "../../utils/password.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { InvalidCredentials } from "../../shared/errors/HttpErrors.ts";
import { UserRole } from "../types/user.types.ts";
import { sendTransactionalEmail } from "../../mail/brevo/service/transactional.service.ts";
import { sendResetPasswordToken, verifyEmailTemplate } from "../../mail/brevo/templates/emailVerificationTemplate.template.ts";
import type{ VerifyEmailInput } from "../schemas/user.schema.ts";
import { hashedOtp } from "../../utils/otp.ts";


export const registerUser = async (data: CreateUserInput): Promise<UserResponse> => {
    const { fullName, email, password, role } = data;
    if (role === UserRole.ADMIN) {
        throw new AppError("admin role cannot be set", 404)
    }
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
        throw new UserAlreadyExistError()
    }
    const hashedPassword = await hashPassword(password);
    const { token, expiresAt } = createVericationToken();
    const newUser: IUser = {
        fullName,
        email,
        role,
        password: hashedPassword,
        verificationToken: token,
        verificationTokenExpiresAt: expiresAt ? expiresAt.toString() : ""
    }
    const user = await User.create(newUser);
    await sendTransactionalEmail({ toEmail: email, toName: fullName, emailSubject: "", htmlContent: verifyEmailTemplate(fullName, token) })
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
        throw new UserNotExistError()
    }
    const isPasswordCorrect = await verifyPassword(password, user.password);
    if (!isPasswordCorrect) {
        throw new InvalidCredentials()
    }
    return {
        id: user._id.toString()
    }
}


export const verifyEmail = async (data: VerifyEmailInput): Promise<void> => {
    const {code} = data;
    const now = Date.now().toString();
    const user = await User.findOne({verificationToken: code, verificationTokenExpiresAt: {$gt: now}}); 

    if(!user){
        throw new UserNotExistError()
    }

    if(user.isEmailVerified){
        throw new AppError("email already verified", 400)
    }

    user.isEmailVerified = true; 
    user.verificationToken = "";
    user.verificationTokenExpiresAt = "";
    await user.save() 
}


// export const sendResetPassord = async (data: ResetPasswordRequestInput): Promise<void> => {
//     const {email} = data;

//     const isEmailExist = await User.findOne({email}); 

//     if(isEmailExist) {
//         await 
//     }
// } 


export const forgotPassword = async (data: ForgotPasswordRequestInput) : Promise<void> => {

    const {email} = data
    const user = await User.findOne({email}); 
    if(!user) return;


    const {otp, hashOtp} = await hashedOtp(); 
    const {expiresAt} = createVericationToken(); 

    user.resetPasswordTokenHashed = hashOtp; 
    user.resetPasswordTokenExpiresAt = expiresAt ? expiresAt.toString() : ""; 
    user. resetPasswordCount =  0; 


    user.passwordResetTokenHashed = ""; 
    user.passwordResetTokenExpiresAt = "";

    await sendTransactionalEmail({toEmail: email, toName: user.fullName, emailSubject: "", htmlContent:sendResetPasswordToken(user.fullName,otp )})

}