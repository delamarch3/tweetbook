import { NextFunction, Request, Response } from "express";
import { ErrorResponse } from "../util/ErrorResponse";
import jwt from "jsonwebtoken";

// Data from jwt payload
export interface Data extends Request {
    id?: number;
    username?: string;
}

const secret = process.env.JWTSECRET || "";

export default async (req: Data, _res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers["authorization"] &&
        req.headers["authorization"].startsWith("Bearer")
    ) {
        token = req.headers["authorization"].split(" ")[1];
    }

    if (!token) return next(new ErrorResponse("Unauthorised", 401));
    try {
        const payload: any = jwt.verify(token, secret);

        req.id = payload.id;
        req.username = payload.username;

        next();
    } catch (err) {
        next(err);
    }
};
