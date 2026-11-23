


export interface IUser {
    fullName: string
    email:string 
    password:string
    role:string, 


    resetPasswordCount?: Number
    resetPasswordTokenHashed?: string
    resetPasswordTokenExpiresAt?:string 


    passwordResetTokenHashed?: string, 
    passwordResetTokenExpiresAt?: string,

    verificationToken:string
    verificationTokenExpiresAt: string

    isEmailVerified?: boolean
    createdAt?: string
    updatedAt?: string
    
}

export interface UserResponse {
    id: string
    fullName: string
    email: string

}


export interface LoginResponse {
    id: string
}

export const UserRole = {
    CANDIDATE: "candidate",
    EMPLOYER: "employer",
    ADMIN: "admin",
} as const
