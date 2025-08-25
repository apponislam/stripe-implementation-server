import { Schema, model } from "mongoose";
import { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        category: { type: String },
        tags: { type: [String], default: [] },
        images: { type: [String], required: true, default: [] },
        stock: { type: Number, required: true },
        quantity: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

export default model<IProduct>("Product", productSchema);
