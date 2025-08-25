"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Product name is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    price: zod_1.z.number().positive("Price must be greater than 0"),
    discountPrice: zod_1.z.number().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()),
    images: zod_1.z.array(zod_1.z.string()).min(1, "At least one image is required"),
    stock: zod_1.z.number().int().nonnegative("Stock cannot be negative"),
    quantity: zod_1.z.number().int().nonnegative().optional(),
});
exports.updateProductSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    price: zod_1.z.number().positive().optional(),
    discountPrice: zod_1.z.number().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    stock: zod_1.z.number().int().nonnegative().optional(),
    quantity: zod_1.z.number().int().nonnegative().optional(),
});
