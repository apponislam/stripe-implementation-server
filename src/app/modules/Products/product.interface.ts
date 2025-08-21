import { Types } from "mongoose";

export interface IProduct {
    _id: string;
    userId: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
    category?: string;
    tags: string[];
    images: string[];
    stock: number;
    quantity?: number;
}
