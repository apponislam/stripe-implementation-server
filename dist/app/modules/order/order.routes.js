"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const order_controllers_1 = require("./order.controllers");
const router = express_1.default.Router();
router.post("/create-checkout-session", auth_1.default, order_controllers_1.orderController.createCheckoutSession);
router.get("/my-orders", auth_1.default, order_controllers_1.orderController.getOrdersByUser);
router.get("/:id", auth_1.default, order_controllers_1.orderController.getOrderById);
router.get("/session/:sessionId", auth_1.default, order_controllers_1.orderController.getOrderBySessionId);
// router.post("/webhook", express.raw({ type: "application/json" }), orderController.handleWebhook);
exports.orderRoutes = router;
