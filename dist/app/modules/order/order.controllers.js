"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderController = void 0;
const order_services_1 = require("./order.services");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const createCheckoutSession = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { items } = req.body;
    const userId = req.user._id;
    const result = yield order_services_1.orderServices.createStripeCheckoutSession(userId, items);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Checkout session created successfully",
        data: result,
    });
}));
const handleWebhook = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    // ✅ Add validation for signature
    if (!sig) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Missing Stripe signature header");
    }
    // ✅ Add validation for webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Stripe webhook secret not configured");
    }
    try {
        const result = yield order_services_1.orderServices.handleStripeWebhook(sig, req.body);
        if (result) {
            (0, sendResponse_1.default)(res, {
                statusCode: http_status_1.default.OK,
                success: true,
                message: "Webhook handled successfully",
                data: result,
            });
        }
        else {
            // ✅ Always return 200 to Stripe to acknowledge webhook receipt
            res.status(200).json({ received: true });
        }
    }
    catch (error) {
        console.error("Webhook controller error:", error);
        // ✅ Still return 200 to Stripe even if we have an error
        // This prevents Stripe from retrying continuously
        res.status(200).json({ received: true, error: error });
    }
}));
const getOrdersByUser = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield order_services_1.orderServices.getOrdersByUserFromDB(userId, page, limit);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
}));
const getOrderById = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = req.params.id;
    const result = yield order_services_1.orderServices.getOrderByIdFromDB(orderId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
}));
const getOrderBySessionId = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const sessionId = req.params.sessionId;
    const result = yield order_services_1.orderServices.getOrderByStripeSessionIdFromDB(sessionId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
}));
const downloadInvoice = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = req.params.id;
    const pdfBuffer = yield order_services_1.orderServices.generateInvoicePDF(orderId);
    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${orderId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    // Send the PDF buffer
    res.send(pdfBuffer);
}));
const downloadInvoiceHTML = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const orderId = req.params.id;
    const order = yield order_services_1.orderServices.getOrderByIdFromDB(orderId);
    // Type assertion to handle populated fields
    const orderObj = order.toObject();
    const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${orderObj.orderId || orderObj._id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .total { font-weight: bold; font-size: 1.2em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INVOICE</h1>
                <p>Invoice #: ${orderObj.orderId || orderObj._id}</p>
                <p>Date: ${new Date(orderObj.createdAt).toLocaleDateString()}</p>
            </div>

            <div class="section">
                <h2>Bill To:</h2>
                <p>${orderObj.userId.name}</p>
                <p>${orderObj.userId.email}</p>
            </div>

            <div class="section">
                <h2>Order Details:</h2>
                <p>Status: ${orderObj.orderStatus}</p>
                <p>Payment: ${orderObj.paymentStatus}</p>
            </div>

            <div class="section">
                <h2>Items:</h2>
                <table>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                    ${orderObj.items
        .map((item) => {
        const price = item.productId.discountPrice || item.productId.price;
        const total = price * item.quantity;
        return `
                            <tr>
                                <td>${item.productId.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${price.toFixed(2)}</td>
                                <td>$${total.toFixed(2)}</td>
                            </tr>
                        `;
    })
        .join("")}
                </table>
            </div>

            <div class="section">
                <p class="total">Total Amount: $${orderObj.totalAmount.toFixed(2)}</p>
                <p>Payment Method: ${orderObj.paymentMethod}</p>
            </div>
        </body>
        </html>
    `;
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${orderId}.html"`);
    res.send(invoiceHTML);
}));
exports.orderController = {
    createCheckoutSession,
    handleWebhook,
    getOrdersByUser,
    getOrderById,
    getOrderBySessionId,
    downloadInvoice,
    downloadInvoiceHTML,
};
