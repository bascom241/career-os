import { AppError } from "./AppError.ts";

export class UserAlreadyExistError extends AppError {
    constructor(message='user already exist'){
        super(message, 409)
    }
}

export class UserNotExistError extends AppError {
    constructor(message = "user does not exist") {
        super(message, 401)
    }
}

export class InvalidCredentials extends AppError {
    constructor(message = "invalid password provided")  {
        super(message, 401)
        
    }
}
