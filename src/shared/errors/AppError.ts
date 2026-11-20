export class AppError extends Error {
    readonly statusCode: number
    readonly isOperational: boolean



    constructor(message: string, statusCode: number = 500, isOperational: boolean = true){
        super(message);
        this.statusCode = statusCode
        this.isOperational = isOperational
      
        this.name = new.target.name

        Error.captureStackTrace?.(this, this.constructor)
    }
    
}

