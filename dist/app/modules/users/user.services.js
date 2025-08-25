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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userServices = void 0;
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const getMyProfileFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield getUserByIdFromDB(userId);
});
const getAllUsersFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield auth_model_1.default.find().select("-password");
    return users;
});
const getUserByIdFromDB = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.default.findById(userId).select("-password");
    return user;
});
exports.userServices = {
    getMyProfileFromDB,
    getAllUsersFromDB,
    getUserByIdFromDB,
};
