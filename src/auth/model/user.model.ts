import mongoose, {Schema} from "mongoose"
import type { IUser } from "../types/user.types.ts"
import { UserRole } from "../types/user.types.ts"
const userSchema = new Schema<IUser>({
    fullName:{
        type: String, 
        required: [true, "full name is required"]
    }, 
    email:{
        type: String, 
        required: [true, "email is required"]
    }, 
    password:{
        type: String, 
        required: [true, "password is required"], 
        min: 8
    }, 
    role: {
        type: String, 
        required: [true, "role is required"], 
        enum:Object.values(UserRole), 
        default: UserRole.CANDIDATE
    }, 
    isEmailVerified: Boolean, 
    
    resetPasswordTokenHashed : String, 
    resetPasswordTokenExpiresAt:String, 
    resetPasswordCount: Number,

    passwordResetTokenHashed: String, 
    passwordResetTokenExpiresAt: String,
    verificationToken:String, 
    verificationTokenExpiresAt: String

}, {timestamps: true })


const User = mongoose.model<IUser>("User", userSchema)

export default User

