"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationUser = void 0;
const zod_1 = require("zod");
const userValidationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3, "Name cannot be empty")
        .refine((val) => val.trim().length > 0, {
        message: "Name is required",
    }),
    username: zod_1.z.string().optional(),
    email: zod_1.z
        .string()
        .min(1, "Email is required")
        .email("Invalid email format")
        .regex(/^\S+@\S+\.\S+$/, "Email must be a valid format"),
    password: zod_1.z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    avatarUrl: zod_1.z.string().optional(),
});
const validateUser = (data) => userValidationSchema.safeParse(data);
const validatePartialUser = (data) => userValidationSchema.partial().safeParse(data);
exports.validationUser = {
    userValidationSchema,
    validateUser,
    validatePartialUser,
};
