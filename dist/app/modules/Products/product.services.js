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
exports.productServices = void 0;
const AppError_1 = __importDefault(require("../../errors/AppError"));
const product_model_1 = __importDefault(require("./product.model"));
const http_status_1 = __importDefault(require("http-status"));
const createProduct = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.create(payload);
    return product;
});
const getMyProducts = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const [products, total] = yield Promise.all([product_model_1.default.find({ userId }).skip(skip).limit(limit), product_model_1.default.countDocuments({ userId })]);
    return {
        data: products,
        meta: {
            page,
            limit,
            total,
        },
    };
});
const getAllProducts = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const [products, total] = yield Promise.all([product_model_1.default.find().skip(skip).limit(limit), product_model_1.default.countDocuments()]);
    return {
        data: products,
        meta: {
            page,
            limit,
            total,
        },
    };
});
const getProductById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(id);
    return product;
});
const updateProduct = (id, userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(id);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    if (product.userId.toString() !== userId.toString()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to update this product");
    }
    Object.assign(product, updateData);
    yield product.save();
    return product;
});
const deleteProduct = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const product = yield product_model_1.default.findById(id);
    if (!product) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
    }
    console.log(product.userId.toString(), userId);
    if (product.userId.toString() !== userId.toString()) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to delete this product");
    }
    yield product.deleteOne();
    return product;
});
exports.productServices = {
    createProduct,
    getMyProducts,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
