"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authServices = void 0;
const config_1 = __importDefault(require("../../config"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const usernameGenerator_1 = require("../../utils/usernameGenerator");
const auth_model_1 = require("./auth.model");
const http_status_1 = __importDefault(require("http-status"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createUserIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const username = yield (0, usernameGenerator_1.userNameGenerator)(payload.name);
    const user = yield auth_model_1.userModel.create(Object.assign(Object.assign({}, payload), { username }));
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };
    const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
});
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.userModel.findOne({ email: payload.email }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const isPasswordValid = yield bcrypt_1.default.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new AppError_1.default(401, "Invalid credentials");
    }
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };
    const accessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const refreshToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    const decoded = jwtHelpers_1.jwtHelper.verifyToken(token, config_1.default.jwt_refresh_secret);
    const user = yield auth_model_1.userModel.findById(decoded._id);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const jwtPayload = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
    };
    const newAccessToken = jwtHelpers_1.jwtHelper.generateToken(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expire);
    const _a = user.toObject(), { password } = _a, userWithoutPassword = __rest(_a, ["password"]);
    // console.log(newAccessToken, userWithoutPassword);
    return {
        accessToken: newAccessToken,
        user: userWithoutPassword,
    };
});
exports.authServices = {
    createUserIntoDB,
    loginUser,
    refreshToken,
};
