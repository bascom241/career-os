


export interface IUser {
    fullName: string
    email:string 
    password:string
    role:string, 
    resetPasswordToken?: string
    resetPasswordTokenExpiresAt?:string 
    verificationToken:string
    verificationTokenExpiresAt: string
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
