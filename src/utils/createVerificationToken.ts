import crypto from "crypto"


interface CreateVerificationTokenResponse  {
    token: string
    expiresAt: Date
}

export function createVerificationToken(expiresIn: number = 15): CreateVerificationTokenResponse {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
    return {token : code, expiresAt}
}
