import express from "express";
import auth from "../../middlewares/auth";
import { orderController } from "./order.controllers";

const router = express.Router();

router.post("/create-checkout-session", auth, orderController.createCheckoutSession);

router.get("/my-orders", auth, orderController.getOrdersByUser);

router.get("/:id", auth, orderController.getOrderById);

router.get("/session/:sessionId", auth, orderController.getOrderBySessionId);

// router.post("/webhook", express.raw({ type: "application/json" }), orderController.handleWebhook);

router.get("/:id/invoice", auth, orderController.downloadInvoice);

router.get("/:id/invoice/html", auth, orderController.downloadInvoiceHTML);

export const orderRoutes = router;
