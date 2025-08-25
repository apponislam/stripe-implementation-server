import express from "express";
import auth from "../../middlewares/auth";
import { cartControllers } from "./cart.controllers";

const router = express.Router();

router.post("/add", auth, cartControllers.addToCart);
router.get("/", auth, cartControllers.getCart);
router.patch("/:productId", auth, cartControllers.updateCartItem);
router.delete("/:productId", auth, cartControllers.removeFromCart);
router.delete("/", auth, cartControllers.clearCart);

export const cartRouter = router;
