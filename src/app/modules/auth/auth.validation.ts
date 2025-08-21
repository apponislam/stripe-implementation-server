import { z } from "zod";

const userValidationSchema = z.object({
    name: z
        .string()
        .min(3, "Name cannot be empty")
        .refine((val) => val.trim().length > 0, {
            message: "Name is required",
        }),

    username: z.string().optional(),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email format")
        .regex(/^\S+@\S+\.\S+$/, "Email must be a valid format"),

    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),

    avatarUrl: z.string().optional(),
});

export type UserZodType = z.infer<typeof userValidationSchema>;

const validateUser = (data: unknown) => userValidationSchema.safeParse(data);
const validatePartialUser = (data: unknown) => userValidationSchema.partial().safeParse(data);

export const validationUser = {
    userValidationSchema,
    validateUser,
    validatePartialUser,
};
