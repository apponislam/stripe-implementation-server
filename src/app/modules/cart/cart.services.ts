// services/cart.service.ts
import { Types } from "mongoose";
import { cartModel } from "./cart.model";
import { ICart, ICartItem } from "./cart.interface";
import httpStatus from "http-status";
import ApiError from "../../errors/AppError";

const addToCart = async (userId: Types.ObjectId, cartItem: ICartItem): Promise<ICart> => {
    let cart = await cartModel.findOne({ userId });

    if (!cart) {
        cart = new cartModel({
            userId,
            items: [cartItem],
        });
    } else {
        const existingItemIndex = cart.items.findIndex((item) => item.productId.toString() === cartItem.productId.toString());

        if (existingItemIndex !== -1) {
            cart.items[existingItemIndex].quantity += cartItem.quantity;
        } else {
            cart.items.push(cartItem);
        }
    }

    return await cart.save();
};

const getCart = async (userId: Types.ObjectId): Promise<ICart | null> => {
    const result = await cartModel.findOne({ userId }).populate("items.productId");
    // console.log(result);
    return result;
};

const updateCartItem = async (userId: Types.ObjectId, productId: string, quantity: number): Promise<ICart> => {
    const cart = await cartModel.findOne({ userId });

    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
    }

    const item = cart.items.find((item) => item.productId.toString() === productId);
    if (!item) {
        throw new ApiError(httpStatus.NOT_FOUND, "Item not found in cart");
    }

    item.quantity = quantity;
    return await cart.save();
};

const removeFromCart = async (userId: Types.ObjectId, productId: string): Promise<ICart> => {
    const cart = await cartModel.findOne({ userId });

    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    return await cart.save();
};

const clearCart = async (userId: Types.ObjectId): Promise<ICart> => {
    const cart = await cartModel.findOne({ userId });

    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
    }

    cart.items = [];
    return await cart.save();
};

// Additional service for order completion
const clearCartAfterOrder = async (userId: Types.ObjectId): Promise<void> => {
    const cart = await cartModel.findOne({ userId });

    if (cart) {
        cart.items = [];
        await cart.save();
    }
};

export const cartServices = {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    clearCartAfterOrder,
};
