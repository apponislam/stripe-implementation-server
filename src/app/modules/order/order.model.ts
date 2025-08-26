import mongoose, { Schema, Document, model } from "mongoose";
import { IOrder } from "./order.interface";

const OrderSchema: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
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
    },
    {
        timestamps: true,
    }
);

export const orderModel = model<IOrder>("Order", OrderSchema);
