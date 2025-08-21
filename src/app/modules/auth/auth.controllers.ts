import { NextFunction, Request, Response } from "express";
import { authServices } from "./auth.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import config from "../../config";
import { convertTimeToMS } from "../../utils/convertTime";
import ApiError from "../../errors/AppError";

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;

    const result = await authServices.createUserIntoDB(userData);

    res.cookie("refreshToken", result.refreshToken, {
        secure: false,
        sameSite: "lax",
        httpOnly: true,
    });

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "User registered successfully",
        data: result,
    });
});

const loginUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const result = await authServices.loginUser({ email, password });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "strict",
        maxAge: convertTimeToMS(config.jwt_refresh_expire),
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User logged in successfully",
        data: {
            ...result,
        },
    });
});

const refreshAccessToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    // console.log(refreshToken);

    if (!refreshToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required");
    }

    // console.log(refreshToken);

    const result = await authServices.refreshToken(refreshToken);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Access token refreshed successfully",
        data: {
            ...result,
        },
    });
});

export const userController = {
    createUser,
    loginUser,
    refreshAccessToken,
};
