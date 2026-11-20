import crypto from 'crypto'
import { promisify } from 'util'
import { AppError } from '../shared/errors/AppError.ts';

const scryptSync = promisify(crypto.scrypt); 


export async function hashPassword (password: string): Promise<string>{
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey: any = await scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword (password: string, storedHash: string ): Promise<boolean>{
    const [salt, key] = storedHash.split(":"); 
    if(!key || !salt){
        throw new AppError("Cannot retrived key",400, false)
    }
    const keyBuffer = Buffer.from(key , "hex"); 
    const derivedKey: any = await scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}