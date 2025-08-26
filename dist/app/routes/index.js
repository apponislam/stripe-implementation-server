"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const user_routes_1 = require("../modules/users/user.routes");
const product_routes_1 = require("../modules/Products/product.routes");
const cart_routes_1 = require("../modules/cart/cart.routes");
const order_routes_1 = require("../modules/order/order.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.authRoutes,
    },
    {
        path: "/users",
        route: user_routes_1.userRoutes,
    },
    {
        path: "/products",
        route: product_routes_1.productRoutes,
    },
    {
        path: "/cart",
        route: cart_routes_1.cartRouter,
    },
    {
        path: "/orders",
        route: order_routes_1.orderRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
