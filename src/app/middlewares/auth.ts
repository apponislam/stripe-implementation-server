import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import config from "../config";
import userModel from "../modules/auth/auth.model";
import ApiError from "../errors/AppError";

const auth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    let token = req.headers.authorization;

    if (token?.startsWith("Bearer ")) token = token.slice(7);

    if (!token) {
        throw new ApiError(401, "Authentication failed: No token provided");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt_access_secret as string) as { email: string };
    } catch (err: any) {
        if (err.name === "TokenExpiredError") {
            throw new ApiError(401, "Authentication failed: Token expired");
        }
        throw new ApiError(401, "Authentication failed: Invalid token");
    }

    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
        throw new ApiError(404, "Authentication failed: User not found");
    }

    req.user = user;
    next();
});

export default auth;
