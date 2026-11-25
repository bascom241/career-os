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
        required: [true, "email is required"],
        unique: true, lowercase: true, trim: true
    }, 
    password:{
        type: String, 
        required: [true, "password is required"], 
        min: 8
    }, 
    role: {
        type: String, 
        required: [true, "role is required"], 
        enum:[...Object.values(UserRole), "talent", "freelancer", "coach", "instructor"], 
        default: UserRole.CANDIDATE
    }, 
    roles: { type: [String], default: [] },
    consentRecords: [{ termsVersion: String, privacyVersion: String, acceptedAt: Date, _id: false }],
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 }, 
    
    resetPasswordTokenHashed : String, 
    resetPasswordTokenExpiresAt:String, 
    resetPasswordCount: Number,

    passwordResetTokenHashed: String, 
    passwordResetTokenExpiresAt: String,
    verificationToken:String, 
    verificationTokenExpiresAt: String

}, {timestamps: true, autoIndex: false })


const User = mongoose.model<IUser>("User", userSchema)

export default User

