"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = __importDefault(require("./app/routes"));
const notFound_1 = __importDefault(require("./app/errors/notFound"));
const globalErrorHandler_1 = __importDefault(require("./app/errors/globalErrorHandler"));
const order_controllers_1 = require("./app/modules/order/order.controllers");
const app = (0, express_1.default)();
const corsOptions = {
    origin: ["http://localhost:3000", "https://messaging-app-client-eta.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.post("/api/v1/orders/webhook", express_1.default.raw({ type: "application/json" }), order_controllers_1.orderController.handleWebhook);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res) => {
    res.send({
        message: "Stripe Payment Server Running",
    });
});
app.use("/api/v1", routes_1.default);
app.use(notFound_1.default);
app.use(globalErrorHandler_1.default);
exports.default = app;
