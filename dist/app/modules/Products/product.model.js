"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    category: { type: String },
    tags: { type: [String], default: [] },
    images: { type: [String], required: true, default: [] },
    stock: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
}, {
    timestamps: true,
    versionKey: false,
});
exports.default = (0, mongoose_1.model)("Product", productSchema);
