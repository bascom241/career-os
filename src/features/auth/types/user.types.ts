


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

    roles?: string[]
    consentRecords?: { termsVersion: string; privacyVersion: string; acceptedAt: Date }[]
    tokenVersion?: number
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
    tokenVersion: number
    user: { id: string; fullName: string; email: string; role: string; roles: string[]; isEmailVerified: boolean; entitlements: string[] }
}

export const UserRole = {
    CANDIDATE: "candidate",
    EMPLOYER: "employer",
    ADMIN: "admin",
} as const
