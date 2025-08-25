import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { productServices } from "./product.services";
import sendResponse from "../../utils/sendResponse";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const payload = { ...req.body, userId };

    const product = await productServices.createProduct(payload as any);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Product created successfully",
        data: product,
    });
});

const getMyProducts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id as string;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { data, meta } = await productServices.getMyProducts(userId, page, limit);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "My products retrieved successfully",
        data,
        meta,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { data, meta } = await productServices.getAllProducts(page, limit);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Products retrieved successfully",
        data,
        meta,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const product = await productServices.getProductById(req.params.id);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Product retrieved successfully",
        data: product,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const product = await productServices.updateProduct(req.params.id, userId, req.body);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Product updated successfully",
        data: product,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const product = await productServices.deleteProduct(req.params.id, userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Product deleted successfully",
        data: product,
    });
});

export const productController = {
    createProduct,
    getMyProducts,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
