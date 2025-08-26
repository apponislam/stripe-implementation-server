import { Types } from "mongoose";

export interface IOrder {
    _id?: Types.ObjectId;
    userId: Types.ObjectId;
    items: Array<{
        productId: Types.ObjectId;
        quantity: number;
    }>;
    paymentStatus: "pending" | "completed" | "failed" | "refunded";
    paymentMethod: "stripe";
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    totalAmount?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
