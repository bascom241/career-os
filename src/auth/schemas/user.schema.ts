import {z} from "zod"
import { UserRole } from "../types/user.types.ts"

export const createUserSchema = z.object({
    body:z.object({
        fullName: z.string().min(4, "Full name must exceed three characters"), 
        email:z.email(), 
        password:z.string().min(9, "password must be more than 8 characters"), 
        role: z.enum(UserRole)
    })
})


export const loginUserSchema = z.object({
    body: z.object({
        email:z.email(), 
        password: z.string().min(9, "password nmust be more than 8 characters")
    })
})

export const verifyEmailSchema = z.object({
    body: z.object({
        code: z.string().min(6, "verification token miust be more than 6 characters")
    })
})


export const forgotPasswordSchema = z.object({
    body: z.object({
        email:z.email(), 
        
    })
})




export type ForgotPasswordRequestInput = z.infer<typeof forgotPasswordSchema>["body"]
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"]
export type LoginUserInput = z.infer<typeof loginUserSchema>["body"]
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];