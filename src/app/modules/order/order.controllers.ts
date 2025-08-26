import { NextFunction, Request, Response } from "express";
import { orderServices } from "./order.services";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import ApiError from "../../errors/AppError";

const createCheckoutSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { items } = req.body;
    const userId = req.user._id;

    const result = await orderServices.createStripeCheckoutSession(userId, items);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Checkout session created successfully",
        data: result,
    });
});

const handleWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"] as string;

    // ✅ Add validation for signature
    if (!sig) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe signature header");
    }

    // ✅ Add validation for webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe webhook secret not configured");
    }

    try {
        const result = await orderServices.handleStripeWebhook(sig, req.body);

        if (result) {
            sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Webhook handled successfully",
                data: result,
            });
        } else {
            // ✅ Always return 200 to Stripe to acknowledge webhook receipt
            res.status(200).json({ received: true });
        }
    } catch (error) {
        console.error("Webhook controller error:", error);
        // ✅ Still return 200 to Stripe even if we have an error
        // This prevents Stripe from retrying continuously
        res.status(200).json({ received: true, error: error });
    }
});

const getOrdersByUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await orderServices.getOrdersByUserFromDB(userId, page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
});

const getOrderById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;

    const result = await orderServices.getOrderByIdFromDB(orderId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const getOrderBySessionId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.params.sessionId;

    const result = await orderServices.getOrderByStripeSessionIdFromDB(sessionId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const downloadInvoice = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;

    const pdfBuffer = await orderServices.generateInvoicePDF(orderId);

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${orderId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);
});

const downloadInvoiceHTML = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;
    const order = await orderServices.getOrderByIdFromDB(orderId);

    // Type assertion to handle populated fields
    const orderObj = order.toObject() as any;

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
                        .map((item: any) => {
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
});
export const orderController = {
    createCheckoutSession,
    handleWebhook,
    getOrdersByUser,
    getOrderById,
    getOrderBySessionId,
    downloadInvoice,
    downloadInvoiceHTML,
};
