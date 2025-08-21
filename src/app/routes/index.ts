import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/user.routes";
import { productRoutes } from "../modules/Products/product.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/users",
        route: userRoutes,
    },
    {
        path: "/products",
        route: productRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
