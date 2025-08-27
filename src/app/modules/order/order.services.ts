import { Types } from "mongoose";
import httpStatus from "http-status";
import productModel from "../Products/product.model";
import ApiError from "../../errors/AppError";
import { orderModel } from "./order.model";
import { IOrder } from "./order.interface";
import stripe from "../../config/stripe";
import config from "../../config";
import userModel from "../auth/auth.model";
import PDFDocument from "pdfkit";

const createOrderIntoDB = async (payload: Omit<IOrder, "createdAt" | "updatedAt">) => {
    const order = await orderModel.create(payload);
    return order;
};

const createStripeCheckoutSession = async (userId: Types.ObjectId, items: Array<{ productId: Types.ObjectId; quantity: number }>) => {
    try {
        // Get user details first
        const user = await userModel.findById(userId);
        if (!user) {
            throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
        }

        // Get product details for all items
        const productIds = items.map((item) => item.productId);
        const products = await productModel.find({ _id: { $in: productIds } });

        if (products.length !== items.length) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Some products not found");
        }

        // Prepare line items for Stripe
        const lineItems = items.map((item) => {
            const product = products.find((p) => p._id.toString() === item.productId.toString());
            if (!product) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Product not found: ${item.productId}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        description: product.description.substring(0, 100),
                        images: product.images,
                    },
                    unit_amount: Math.round((product.discountPrice || product.price) * 100),
                },
                quantity: item.quantity,
            };
        });

        // Calculate total amount
        const totalAmount = items.reduce((total, item) => {
            const product = products.find((p) => p._id.toString() === item.productId.toString());
            return total + (product?.discountPrice || product?.price || 0) * item.quantity;
        }, 0);

        // Create Stripe checkout session WITH CUSTOMER INFO
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${config.client_url}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config.client_url}/order-cancel`,
            customer_email: user.email,
            metadata: {
                userId: userId.toString(),
                userEmail: user.email,
                userName: user.name,
                items: JSON.stringify(items),
            },
        });

        const order = await orderModel.create({
            userId,
            orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            items,
            totalAmount,
            finalAmount: totalAmount,
            paymentStatus: "pending",
            paymentMethod: "stripe",
            stripeSessionId: session.id,
            orderStatus: "pending",
        });

        return {
            sessionId: session.id,
            url: session.url,
            orderId: order._id,
        };
    } catch (error) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to create checkout session");
    }
};

const handleStripeWebhook = async (sig: string, body: Buffer) => {
    // console.log("Webhook signature:", sig);
    // console.log("Webhook body length:", body.length);

    try {
        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        // console.log("Event type:", event.type);

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            // console.log("Session ID:", session.id);
            // console.log("Payment status:", session.payment_status);

            // ✅ Check if payment was actually successful
            if (session.payment_status === "paid") {
                // Update order payment status
                const order = await orderModel
                    .findOneAndUpdate(
                        { stripeSessionId: session.id },
                        {
                            paymentStatus: "completed",
                            orderStatus: "confirmed",
                            stripePaymentIntentId: session.payment_intent,
                        },
                        { new: true }
                    )
                    .populate("userId", "name email");

                if (!order) {
                    console.error("Order not found for session:", session.id);
                    throw new ApiError(httpStatus.NOT_FOUND, "Order not found for this session");
                }

                console.log("Order updated successfully:", order._id);

                // Update product stock
                for (const item of order.items) {
                    await productModel.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } }, { new: true });
                    console.log("Stock updated for product:", item.productId);
                }

                return order;
            } else {
                console.log("Payment not completed, status:", session.payment_status);
                return null;
            }
        }

        if (event.type === "checkout.session.async_payment_failed") {
            const session = event.data.object;
            console.log("Payment failed for session:", session.id);

            const order = await orderModel
                .findOneAndUpdate(
                    { stripeSessionId: session.id },
                    {
                        paymentStatus: "failed",
                        orderStatus: "cancelled",
                    },
                    { new: true }
                )
                .populate("userId", "name email");

            return order;
        }

        console.log("Unhandled event type:", event.type);
        return null;
    } catch (error) {
        console.error("Error in handleStripeWebhook:", error);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Webhook handling failed`);
    }
};

const getOrdersByUserFromDB = async (userId: Types.ObjectId, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const orders = await orderModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
            path: "userId",
            select: "name email image",
        })
        .populate({
            path: "items.productId",
            select: "name price discountPrice images description category stock",
        });

    const total = await orderModel.countDocuments({ userId });

    return {
        orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

const getOrderByIdFromDB = async (orderId: string) => {
    const order = await orderModel.findById(orderId).populate("userId", "name email").populate({
        path: "items.productId",
        select: "name price discountPrice images description category stock",
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const updateOrderStatusInDB = async (orderId: string, status: IOrder["orderStatus"]) => {
    const order = await orderModel.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true, runValidators: true });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

const getOrderByStripeSessionIdFromDB = async (stripeSessionId: string) => {
    const order = await orderModel.findOne({ stripeSessionId }).populate("userId", "name email").populate("items.productId", "name price images");

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    return order;
};

// const generateInvoicePDF = async (orderId: string): Promise<Buffer> => {
//     const order = await orderModel.findById(orderId).populate("userId", "name email").populate("items.productId", "name price discountPrice").exec();

//     if (!order) {
//         throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
//     }

//     // Type assertion for the populated order
//     const populatedOrder = order as any;

//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         const chunks: Buffer[] = [];

//         doc.on("data", (chunk) => chunks.push(chunk));
//         doc.on("end", () => resolve(Buffer.concat(chunks)));
//         doc.on("error", reject);

//         // Invoice header
//         doc.fontSize(20).text("INVOICE", 50, 50);
//         doc.fontSize(10).text(`Invoice #: ${populatedOrder.orderId || populatedOrder._id.toString()}`, 50, 80);
//         doc.text(`Date: ${new Date(populatedOrder.createdAt).toLocaleDateString()}`, 50, 95);

//         // Company info
//         doc.text("Your Store Name", 400, 50);
//         doc.fontSize(8).text("123 Store Street", 400, 65);
//         doc.text("City, State 12345", 400, 80);
//         doc.text("support@amarshop.com", 400, 95);

//         // Customer info
//         doc.fontSize(12).text("BILL TO:", 50, 130);
//         doc.fontSize(10).text(populatedOrder.userId.name, 50, 145);
//         doc.text(populatedOrder.userId.email, 50, 160);

//         // Order details
//         doc.fontSize(12).text("ORDER DETAILS:", 50, 190);
//         doc.text(`Order Status: ${populatedOrder.orderStatus}`, 50, 205);
//         doc.text(`Payment Status: ${populatedOrder.paymentStatus}`, 50, 220);

//         // Line items
//         let y = 250;
//         doc.fontSize(12).text("DESCRIPTION", 50, y);
//         doc.text("QTY", 250, y);
//         doc.text("PRICE", 350, y);
//         doc.text("TOTAL", 450, y);

//         y += 20;
//         populatedOrder.items.forEach((item: any) => {
//             const price = item.productId.discountPrice || item.productId.price;
//             const total = price * item.quantity;

//             doc.text(item.productId.name, 50, y);
//             doc.text(item.quantity.toString(), 250, y);
//             doc.text(`$${price.toFixed(2)}`, 350, y);
//             doc.text(`$${total.toFixed(2)}`, 450, y);
//             y += 15;
//         });

//         // Total
//         y += 20;
//         doc.fontSize(12).text(`Total: $${populatedOrder.totalAmount.toFixed(2)}`, 400, y);

//         // Payment method
//         doc.text(`Payment Method: ${populatedOrder.paymentMethod}`, 50, y + 30);

//         doc.end();
//     });
// };

const generateInvoicePDF = async (orderId: string): Promise<Buffer> => {
    const order = await orderModel.findById(orderId).populate("userId", "name email address").populate("items.productId", "name price discountPrice images").exec();

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    const populatedOrder = order as any;

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Adjusted column positions - MOVED LEFT
        const leftColumn = 40;
        const rightColumn = 350; // MOVED LEFT from 400
        const pageWidth = 595;

        // Draw line function
        const drawLine = (y: number) => {
            doc.moveTo(leftColumn, y)
                .lineTo(pageWidth - 40, y)
                .stroke();
        };

        // Header - LEFT SIDE
        doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", leftColumn, 40);
        doc.fontSize(10).text("AMARSHOP", leftColumn, 70);

        // Invoice details - RIGHT SIDE (MOVED LEFT)
        doc.fontSize(10)
            .text(`Invoice #: ${populatedOrder.orderId || populatedOrder._id.toString().slice(-8).toUpperCase()}`, rightColumn, 40)
            .text(`Date: ${new Date(populatedOrder.createdAt).toLocaleDateString()}`, rightColumn, 55)
            .text(`Order Date: ${new Date(populatedOrder.createdAt).toLocaleDateString()}`, rightColumn, 70);

        // From section - LEFT SIDE
        doc.fontSize(11).font("Helvetica-Bold").text("FROM:", leftColumn, 110);
        doc.fontSize(10).text("Amarshop Ltd.", leftColumn, 125).text("123 E-commerce Street", leftColumn, 140).text("Digital City, DC 12345", leftColumn, 155).text("support@amarshop.com", leftColumn, 170);

        // Bill To section - LEFT SIDE
        const customer = populatedOrder.userId;
        doc.fontSize(11).font("Helvetica-Bold").text("BILL TO:", leftColumn, 200);

        if (customer) {
            let billToY = 215;
            if (customer.name) {
                doc.fontSize(10).text(customer.name, leftColumn, billToY);
                billToY += 15;
            }
            if (customer.email) {
                doc.text(customer.email, leftColumn, billToY);
                billToY += 15;
            }
            if (customer.address) {
                if (customer.address.street) {
                    doc.text(customer.address.street, leftColumn, billToY);
                    billToY += 15;
                }
                const cityStateZip = `${customer.address.city || ""}${customer.address.city && customer.address.state ? ", " : ""}${customer.address.state || ""} ${customer.address.zipCode || ""}`.trim();
                if (cityStateZip) {
                    doc.text(cityStateZip, leftColumn, billToY);
                }
            }
        } else {
            doc.fontSize(10).text("N/A", leftColumn, 215);
        }

        // Order info - RIGHT SIDE (MOVED LEFT)
        doc.fontSize(11).font("Helvetica-Bold").text("ORDER INFO:", rightColumn, 110);

        // Labels and values in separate columns for perfect alignment
        const statusLabelX = rightColumn;
        const statusValueX = rightColumn + 85; // Reduced gap

        doc.fontSize(10).text("Status:", statusLabelX, 125).text("Payment:", statusLabelX, 140).text("Method:", statusLabelX, 155);

        doc.fontSize(10).text(populatedOrder.orderStatus.toUpperCase(), statusValueX, 125).text(populatedOrder.paymentStatus.toUpperCase(), statusValueX, 140).text(populatedOrder.paymentMethod, statusValueX, 155);

        // Items table - ADJUSTED COLUMN POSITIONS
        drawLine(300);

        // Table headers with adjusted column positions
        doc.fontSize(11)
            .font("Helvetica-Bold")
            .text("DESCRIPTION", leftColumn, 315, { width: 250 }) // Reduced width
            .text("QTY", 320, 315) // MOVED LEFT
            .text("PRICE", 370, 315) // MOVED LEFT
            .text("TOTAL", 440, 315); // MOVED LEFT

        drawLine(330);

        // Items
        let y = 345;
        populatedOrder.items.forEach((item: any) => {
            const price = item.productId.discountPrice || item.productId.price;
            const total = price * item.quantity;

            doc.fontSize(10)
                .text(item.productId.name, leftColumn, y, { width: 250 }) // Reduced width
                .text(item.quantity.toString(), 320, y) // MOVED LEFT
                .text(`$${price.toFixed(2)}`, 370, y) // MOVED LEFT
                .text(`$${total.toFixed(2)}`, 440, y); // MOVED LEFT

            y += 20;
        });

        // Totals section - PERFECT ALIGNMENT WITH ITEMS TABLE
        drawLine(y + 20);

        // Align with the "TOTAL" column from items table (440 position)
        const totalLabelX = 370; // MOVED LEFT to align with "PRICE" column
        const totalValueX = 440; // MOVED LEFT to align with "TOTAL" column

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .text("Subtotal:", totalLabelX, y + 40)
            .text(`$${populatedOrder.totalAmount.toFixed(2)}`, totalValueX, y + 40);

        let currentY = y + 60;

        if (populatedOrder.taxAmount > 0) {
            doc.text("Tax:", totalLabelX, currentY).text(`$${populatedOrder.taxAmount.toFixed(2)}`, totalValueX, currentY);
            currentY += 20;
        }

        if (populatedOrder.shippingCost > 0) {
            doc.text("Shipping:", totalLabelX, currentY).text(`$${populatedOrder.shippingCost.toFixed(2)}`, totalValueX, currentY);
            currentY += 20;
        }

        if (populatedOrder.discount > 0) {
            doc.text("Discount:", totalLabelX, currentY).text(`-$${populatedOrder.discount.toFixed(2)}`, totalValueX, currentY);
            currentY += 20;
        }

        // Grand total - PERFECT ALIGNMENT
        doc.fontSize(14)
            .font("Helvetica-Bold")
            .text("TOTAL:", totalLabelX, currentY + 10)
            .text(`$${populatedOrder.totalAmount.toFixed(2)}`, totalValueX, currentY + 10);

        drawLine(currentY + 35);

        // Footer
        doc.fontSize(9)
            .text("Thank you for your purchase!", leftColumn, currentY + 50)
            .text("Contact: support@amarshop.com | Return Policy: 30 days", leftColumn, currentY + 65);

        doc.end();
    });
};
export const orderServices = {
    createOrderIntoDB,
    createStripeCheckoutSession,
    handleStripeWebhook,
    getOrdersByUserFromDB,
    getOrderByIdFromDB,
    updateOrderStatusInDB,
    getOrderByStripeSessionIdFromDB,
    generateInvoicePDF,
};
