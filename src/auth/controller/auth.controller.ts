import type { Response, Request } from "express";
import type{ NextFunction } from "express";
import type { CreateUserInput, LoginUserInput } from "../schemas/user.schema.ts";
import { generateTokenAndSetCookie } from "../../utils/generateToken.ts";
import { registerUser, loginUser } from "../service/auth.service.ts";


export async function register (req: Request, res: Response, next: NextFunction) {
    try{
        const {fullName , email , password, role} = req.body
        const dataToSend : CreateUserInput = {
            fullName, 
            email, 
            password, 
            role
        }; 
        const data = await registerUser(dataToSend); 
        const {id} = data;
        generateTokenAndSetCookie(res, id); 
        res.status(201).json({success:true, message: "user created successfully", data})
    }catch(error: any){
        next(error)
    }
} 

export async function login (req:Request , res:Response, next: NextFunction) {
    try {
        const {email, password} = req.body;
        const dataToSend: LoginUserInput = {
            email, 
            password
        }
        const data = await loginUser(dataToSend); 
        const {id} = data; 
        generateTokenAndSetCookie(res, id); 
        res.status(200).json({success: true, message: "login successfully"})
    } catch (error) {
        next(error)
    }
}