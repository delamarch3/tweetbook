import { NextFunction, Request, Response } from "express"

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
    let error = {...err}

    error.message = err.message

    res.status(err.statusCode || 500).json({message: error.message || 'Server error'})   
}