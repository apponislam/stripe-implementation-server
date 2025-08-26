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
exports.orderServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const product_model_1 = __importDefault(require("../Products/product.model"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const order_model_1 = require("./order.model");
const stripe_1 = __importDefault(require("../../config/stripe"));
const config_1 = __importDefault(require("../../config"));
const createOrderIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.orderModel.create(payload);
    return order;
});
const createStripeCheckoutSession = (userId, items) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get product details for all items
        const productIds = items.map((item) => item.productId);
        const products = yield product_model_1.default.find({ _id: { $in: productIds } });
        if (products.length !== items.length) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Some products not found");
        }
        // Prepare line items for Stripe
        const lineItems = items.map((item) => {
            const product = products.find((p) => p._id.toString() === item.productId.toString());
            if (!product) {
                throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Product not found: ${item.productId}`);
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
            return total + ((product === null || product === void 0 ? void 0 : product.discountPrice) || (product === null || product === void 0 ? void 0 : product.price) || 0) * item.quantity;
        }, 0);
        // Create Stripe checkout session
        const session = yield stripe_1.default.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${config_1.default.client_url}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config_1.default.client_url}/`,
            metadata: {
                userId: userId.toString(),
                items: JSON.stringify(items), // Store items in metadata for webhook
            },
        });
        // Create order in database with pending status
        const order = yield order_model_1.orderModel.create({
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
    }
    catch (error) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to create checkout session");
    }
});
const handleStripeWebhook = (sig, body) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = stripe_1.default.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // Update order payment status
            const order = yield order_model_1.orderModel.findOneAndUpdate({ stripeSessionId: session.id }, {
                paymentStatus: "completed",
                stripePaymentIntentId: session.payment_intent,
            }, { new: true });
            if (!order) {
                throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found for this session");
            }
            // Update product stock (reduce stock by ordered quantities)
            for (const item of order.items) {
                yield product_model_1.default.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }
            return order;
        }
        return null;
    }
    catch (error) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Webhook handling failed");
    }
});
const getOrdersByUserFromDB = (userId_1, ...args_1) => __awaiter(void 0, [userId_1, ...args_1], void 0, function* (userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const orders = yield order_model_1.orderModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("items.productId", "name price images");
    const total = yield order_model_1.orderModel.countDocuments({ userId });
    return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
});
const getOrderByIdFromDB = (orderId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.orderModel.findById(orderId).populate("userId", "name email").populate("items.productId", "name price images category");
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return order;
});
const updateOrderStatusInDB = (orderId, status) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.orderModel.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true, runValidators: true });
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return order;
});
const getOrderByStripeSessionIdFromDB = (stripeSessionId) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.orderModel.findOne({ stripeSessionId }).populate("userId", "name email").populate("items.productId", "name price images");
    if (!order) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Order not found");
    }
    return order;
});
exports.orderServices = {
    createOrderIntoDB,
    createStripeCheckoutSession,
    handleStripeWebhook,
    getOrdersByUserFromDB,
    getOrderByIdFromDB,
    updateOrderStatusInDB,
    getOrderByStripeSessionIdFromDB,
};
