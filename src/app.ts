import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import notFound from "./app/errors/notFound";
import globalErrorHandler from "./app/errors/globalErrorHandler";
import { orderController } from "./app/modules/order/order.controllers";

const app: Application = express();

const corsOptions = {
    origin: ["http://localhost:3000", "https://messaging-app-client-eta.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));

app.post("/api/v1/orders/webhook", express.raw({ type: "application/json" }), orderController.handleWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.send({
        message: "Massaging App Server Running",
    });
});

app.use("/api/v1", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
