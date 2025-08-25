import { Model, Schema, model } from "mongoose";
import { ICart, ICartItem } from "./cart.interface";

interface CartModel extends Model<ICart> {}

const cartItemSchema = new Schema<ICartItem>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"],
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const cartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        items: [cartItemSchema],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export const cartModel = model<ICart, CartModel>("Cart", cartSchema);
