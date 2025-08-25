import ApiError from "../../errors/AppError";
import { IProduct } from "./product.interface";
import productModel from "./product.model";
import httpStatus from "http-status";

const createProduct = async (payload: IProduct) => {
    const product = await productModel.create(payload);
    return product;
};

const getMyProducts = async (userId: string, page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([productModel.find({ userId }).skip(skip).limit(limit), productModel.countDocuments({ userId })]);

    return {
        data: products,
        meta: {
            page,
            limit,
            total,
        },
    };
};

const getAllProducts = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([productModel.find().skip(skip).limit(limit), productModel.countDocuments()]);

    return {
        data: products,
        meta: {
            page,
            limit,
            total,
        },
    };
};

const getProductById = async (id: string) => {
    const product = await productModel.findById(id);
    return product;
};

const updateProduct = async (id: string, userId: string, updateData: Partial<IProduct>) => {
    const product = await productModel.findById(id);

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    if (product.userId.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this product");
    }

    Object.assign(product, updateData);
    await product.save();

    return product;
};

const deleteProduct = async (id: string, userId: string) => {
    const product = await productModel.findById(id);
    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
    }

    console.log(product.userId.toString(), userId);

    if (product.userId.toString() !== userId.toString()) {
        throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this product");
    }

    await product.deleteOne();
    return product;
};

export const productServices = {
    createProduct,
    getMyProducts,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
