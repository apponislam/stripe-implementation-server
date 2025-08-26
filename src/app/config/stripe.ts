import Stripe from "stripe";
import ApiError from "../errors/AppError";
import httpStatus from "http-status";
import config from ".";

if (!config.stripe_secret_key) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(config.stripe_secret_key, {
    apiVersion: "2025-07-30.basil",
    typescript: true,
});

export default stripe;
