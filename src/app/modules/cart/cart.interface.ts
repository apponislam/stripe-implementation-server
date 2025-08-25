import { Types } from "mongoose";

export interface ICartItem {
    productId: Types.ObjectId;
    quantity: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ICart {
    userId: Types.ObjectId;
    items: ICartItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
