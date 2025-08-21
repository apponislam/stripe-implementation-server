import config from "../../config";
import { jwtHelper } from "../../helpers/jwtHelpers";
import { userNameGenerator } from "../../utils/usernameGenerator";
import { TUser } from "./auth.interface";
import { userModel } from "./auth.model";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import ApiError from "../../errors/AppError";

const createUserIntoDB = async (payload: Omit<TUser, "username">) => {
    const username = await userNameGenerator(payload.name);

    const user = await userModel.create({
        ...payload,
        username,
    });

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

const loginUser = async (payload: { email: string; password: string }) => {
    const user = await userModel.findOne({ email: payload.email }).select("+password");
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };

    const accessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

    const refreshToken = jwtHelper.generateToken(jwtPayload, config.jwt_refresh_secret as string, config.jwt_refresh_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
};

const refreshToken = async (token: string) => {
    const decoded = jwtHelper.verifyToken(token, config.jwt_refresh_secret as string);

    const user = await userModel.findById(decoded._id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };

    const newAccessToken = jwtHelper.generateToken(jwtPayload, config.jwt_access_secret as string, config.jwt_access_expire as string);

    const { password, ...userWithoutPassword } = user.toObject();

    // console.log(newAccessToken, userWithoutPassword);

    return {
        accessToken: newAccessToken,
        user: userWithoutPassword,
    };
};

export const authServices = {
    createUserIntoDB,
    loginUser,
    refreshToken,
};
