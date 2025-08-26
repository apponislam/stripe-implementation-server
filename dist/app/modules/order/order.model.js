"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderModel = void 0;
const mongoose_1 = require("mongoose");
const OrderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
        },
    ],
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        enum: ["stripe"],
        default: "stripe",
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    orderStatus: {
        type: String,
        enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    totalAmount: Number,
}, {
    timestamps: true,
});
exports.orderModel = (0, mongoose_1.model)("Order", OrderSchema);
