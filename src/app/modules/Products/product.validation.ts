import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be greater than 0"),
    discountPrice: z.number().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()),
    images: z.array(z.string()).min(1, "At least one image is required"),
    stock: z.number().int().nonnegative("Stock cannot be negative"),
    quantity: z.number().int().nonnegative().optional(),
});

export const updateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    discountPrice: z.number().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    stock: z.number().int().nonnegative().optional(),
    quantity: z.number().int().nonnegative().optional(),
});
