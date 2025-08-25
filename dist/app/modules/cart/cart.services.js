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
exports.cartServices = void 0;
const cart_model_1 = require("./cart.model");
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const addToCart = (userId, cartItem) => __awaiter(void 0, void 0, void 0, function* () {
    let cart = yield cart_model_1.cartModel.findOne({ userId });
    if (!cart) {
        cart = new cart_model_1.cartModel({
            userId,
            items: [cartItem],
        });
    }
    else {
        const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === cartItem.productId.toString());
        if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += cartItem.quantity;
        }
        else {
            cart.items.push(cartItem);
        }
    }
    return yield cart.save();
});
const getCart = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield cart_model_1.cartModel.findOne({ userId }).populate("items.productId");
    // console.log(result);
    return result;
});
const updateCartItem = (userId, productId, quantity) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.cartModel.findOne({ userId });
    if (!cart) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Cart not found");
    }
    const item = cart.items.find((item) => item.productId.toString() === productId);
    if (!item) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Item not found in cart");
    }
    item.quantity = quantity;
    return yield cart.save();
});
const removeFromCart = (userId, productId) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.cartModel.findOne({ userId });
    if (!cart) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Cart not found");
    }
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    return yield cart.save();
});
const clearCart = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.cartModel.findOne({ userId });
    if (!cart) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Cart not found");
    }
    cart.items = [];
    return yield cart.save();
});
// Additional service for order completion
const clearCartAfterOrder = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const cart = yield cart_model_1.cartModel.findOne({ userId });
    if (cart) {
        cart.items = [];
        yield cart.save();
    }
});
exports.cartServices = {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    clearCartAfterOrder,
};
