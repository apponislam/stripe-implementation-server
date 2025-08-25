"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const cart_controllers_1 = require("./cart.controllers");
const router = express_1.default.Router();
router.post("/add", auth_1.default, cart_controllers_1.cartControllers.addToCart);
router.get("/", auth_1.default, cart_controllers_1.cartControllers.getCart);
router.patch("/:productId", auth_1.default, cart_controllers_1.cartControllers.updateCartItem);
router.delete("/:productId", auth_1.default, cart_controllers_1.cartControllers.removeFromCart);
router.delete("/", auth_1.default, cart_controllers_1.cartControllers.clearCart);
exports.cartRouter = router;
