"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const _1 = __importDefault(require("."));
if (!_1.default.stripe_secret_key) {
    throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "STRIPE_SECRET_KEY is not defined in environment variables");
}
const stripe = new stripe_1.default(_1.default.stripe_secret_key, {
    apiVersion: "2025-07-30.basil",
    typescript: true,
});
exports.default = stripe;
