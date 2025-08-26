import { Types } from "mongoose";
import httpStatus from "http-status";
import productModel from "../Products/product.model";
import ApiError from "../../errors/AppError";
import { orderModel } from "./order.model";
import { IOrder } from "./order.interface";
import stripe from "../../config/stripe";
import config from "../../config";

const createOrderIntoDB = async (payload: Omit<IOrder, "createdAt" | "updatedAt">) => {
    const order = await orderModel.create(payload);
    return order;
};

const createStripeCheckoutSession = async (userId: Types.ObjectId, items: Array<{ productId: Types.ObjectId; quantity: number }>) => {
    try {
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

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${config.client_url}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.client_url}/`,
            metadata: {
                userId: userId.toString(),
                items: JSON.stringify(items), // Store items in metadata for webhook
            },
        });

        // Create order in database with pending status
        const order = await orderModel.create({
            userId,
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

const handleStripeWebhook = async (sig: string, body: any) => {
    try {
        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;

            // Update order payment status
            const order = await orderModel.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    paymentStatus: "completed",
                    stripePaymentIntentId: session.payment_intent,
                },
                { new: true }
            );

            if (!order) {
                throw new ApiError(httpStatus.NOT_FOUND, "Order not found for this session");
            }

            // Update product stock (reduce stock by ordered quantities)
            for (const item of order.items) {
                await productModel.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }

            return order;
        }

        return null;
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Webhook handling failed");
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
