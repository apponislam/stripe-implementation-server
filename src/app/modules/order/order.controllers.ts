import { NextFunction, Request, Response } from "express";
import { orderServices } from "./order.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/AppError";

const createCheckoutSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { items } = req.body;
    const userId = req.user._id;

    const result = await orderServices.createStripeCheckoutSession(userId, items);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Checkout session created successfully",
        data: result,
    });
});

// const handleWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//     const sig = req.headers["stripe-signature"] as string;

//     const result = await orderServices.handleStripeWebhook(sig, req.body);

//     if (result) {
//         sendResponse(res, {
//             statusCode: httpStatus.OK,
//             success: true,
//             message: "Webhook handled successfully",
//             data: result,
//         });
//     } else {
//         res.status(200).json({ received: true });
//     }
// });

const handleWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"] as string;

    // ✅ Add validation for signature
    if (!sig) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe signature header");
    }

    // ✅ Add validation for webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe webhook secret not configured");
    }

    try {
        const result = await orderServices.handleStripeWebhook(sig, req.body);

        if (result) {
            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Webhook handled successfully",
                data: result,
            });
        } else {
            // ✅ Always return 200 to Stripe to acknowledge webhook receipt
            res.status(200).json({ received: true });
        }
    } catch (error) {
        console.error("Webhook controller error:", error);
        // ✅ Still return 200 to Stripe even if we have an error
        // This prevents Stripe from retrying continuously
        res.status(200).json({ received: true, error: error });
    }
});

const getOrdersByUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderServices.getOrdersByUserFromDB(userId, page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
});

const getOrderById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;

    const result = await orderServices.getOrderByIdFromDB(orderId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const getOrderBySessionId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.params.sessionId;

    const result = await orderServices.getOrderByStripeSessionIdFromDB(sessionId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

export const orderController = {
    createCheckoutSession,
    handleWebhook,
    getOrdersByUser,
    getOrderById,
    getOrderBySessionId,
};
