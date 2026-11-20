import {z} from "zod"
import { UserRole } from "../types/user.types.ts"

export const createUserSchema = z.object({
    body:z.object({
        fullName: z.string().min(3, "Full name must exceed three characters"), 
        email:z.email(), 
        password:z.string().min(8, "password must be more than 8 characters"), 
        role: z.enum(UserRole)
    })
})


export const loginUserSchema = z.object({
    body: z.object({
        email:z.email(), 
        password: z.string().min(8, "password nmust be more than 8 characters")
    })
})




export type LoginUserInput = z.infer<typeof loginUserSchema>["body"]
export type CreateUserInput = z.infer<typeof createUserSchema>["body"];