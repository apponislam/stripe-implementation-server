import { Types } from "mongoose";
import httpStatus from "http-status";
import productModel from "../Products/product.model";
import ApiError from "../../errors/AppError";
import { orderModel } from "./order.model";
import { IOrder } from "./order.interface";
import stripe from "../../config/stripe";
import config from "../../config";
import userModel from "../auth/auth.model";

const createOrderIntoDB = async (payload: Omit<IOrder, "createdAt" | "updatedAt">) => {
    const order = await orderModel.create(payload);
    return order;
};

const createStripeCheckoutSession = async (userId: Types.ObjectId, items: Array<{ productId: Types.ObjectId; quantity: number }>) => {
    try {
        // Get user details first
        const user = await userModel.findById(userId);
        if (!user) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
        }

        // Get product details for all items
        const productIds = items.map((item) => item.productId);
        const products = await productModel.find({ _id: { $in: productIds } });

        if (products.length !== items.length) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Some products not found");
        }

        // Prepare line items for Stripe
        const lineItems = items.map((item) => {
            const product = products.find((p) => p._id.toString() === item.productId.toString());
            if (!product) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Product not found: ${item.productId}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        description: product.description.substring(0, 100),
                        images: product.images,
                    },
                    unit_amount: Math.round((product.discountPrice || product.price) * 100),
                },
                quantity: item.quantity,
            };
        });

        // Calculate total amount
        const totalAmount = items.reduce((total, item) => {
            const product = products.find((p) => p._id.toString() === item.productId.toString());
            return total + (product?.discountPrice || product?.price || 0) * item.quantity;
        }, 0);

        // Create Stripe checkout session WITH CUSTOMER INFO
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${config.client_url}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.client_url}/order-cancel`,
            customer_email: user.email,
            metadata: {
                userId: userId.toString(),
                userEmail: user.email,
                userName: user.name,
                items: JSON.stringify(items),
            },
        });

        const order = await orderModel.create({
            userId,
            orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            items,
            totalAmount,
            finalAmount: totalAmount,
            paymentStatus: "pending",
            paymentMethod: "stripe",
            stripeSessionId: session.id,
            orderStatus: "pending",
        });

        return {
            sessionId: session.id,
            url: session.url,
            orderId: order._id,
        };
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create checkout session");
    }
};

const handleStripeWebhook = async (sig: string, body: Buffer) => {
    // console.log("Webhook signature:", sig);
    // console.log("Webhook body length:", body.length);

    try {
        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        // console.log("Event type:", event.type);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // console.log("Session ID:", session.id);
            // console.log("Payment status:", session.payment_status);

            // ✅ Check if payment was actually successful
            if (session.payment_status === "paid") {
                // Update order payment status
                const order = await orderModel
                    .findOneAndUpdate(
                        { stripeSessionId: session.id },
                        {
                            paymentStatus: "completed",
                            orderStatus: "confirmed",
                            stripePaymentIntentId: session.payment_intent,
                        },
                        { new: true }
                    )
                    .populate("userId", "name email");

                if (!order) {
                    console.error("Order not found for session:", session.id);
                    throw new ApiError(httpStatus.NOT_FOUND, "Order not found for this session");
                }

                console.log("Order updated successfully:", order._id);

                // Update product stock
                for (const item of order.items) {
                    await productModel.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
                    console.log("Stock updated for product:", item.productId);
                }

                return order;
            } else {
                console.log("Payment not completed, status:", session.payment_status);
                return null;
            }
        }

        if (event.type === "checkout.session.async_payment_failed") {
            const session = event.data.object;
            console.log("Payment failed for session:", session.id);

            const order = await orderModel
                .findOneAndUpdate(
                    { stripeSessionId: session.id },
                    {
                        paymentStatus: "failed",
                        orderStatus: "cancelled",
                    },
                    { new: true }
                )
                .populate("userId", "name email");

            return order;
        }

        console.log("Unhandled event type:", event.type);
        return null;
    } catch (error) {
        console.error("Error in handleStripeWebhook:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Webhook handling failed`);
    }
};

const getOrdersByUserFromDB = async (userId: Types.ObjectId, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const orders = await orderModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("items.productId", "name price images");

    const total = await orderModel.countDocuments({ userId });

    return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

const getOrderByIdFromDB = async (orderId: string) => {
    const order = await orderModel.findById(orderId).populate("userId", "name email").populate("items.productId", "name price images category");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const updateOrderStatusInDB = async (orderId: string, status: IOrder["orderStatus"]) => {
    const order = await orderModel.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true, runValidators: true });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const getOrderByStripeSessionIdFromDB = async (stripeSessionId: string) => {
    const order = await orderModel.findOne({ stripeSessionId }).populate("userId", "name email").populate("items.productId", "name price images");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

export const orderServices = {
    createOrderIntoDB,
    createStripeCheckoutSession,
    handleStripeWebhook,
    getOrdersByUserFromDB,
    getOrderByIdFromDB,
    updateOrderStatusInDB,
    getOrderByStripeSessionIdFromDB,
};
