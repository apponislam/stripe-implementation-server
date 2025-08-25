// controllers/cart.controller.ts
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import { cartServices } from "./cart.services";
import sendResponse from "../../utils/sendResponse";

const addToCart = catchAsync(async (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const result = await cartServices.addToCart(userId, { productId, quantity });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product added to cart successfully",
        data: result,
    });
});

const getCart = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await cartServices.getCart(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart retrieved successfully",
        data: result || { userId, items: [] },
    });
});

const updateCartItem = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    const result = await cartServices.updateCartItem(userId, productId, quantity);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart item updated successfully",
        data: result,
    });
});

const removeFromCart = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const userId = req.user._id;

    const result = await cartServices.removeFromCart(userId, productId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Item removed from cart successfully",
        data: result,
    });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await cartServices.clearCart(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart cleared successfully",
        data: result,
    });
});

export const cartControllers = {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart,
};
