import { Request, Response, NextFunction } from "express";
import ApiError from "../errors/AppError";
import catchAsync from "../utils/catchAsync";
import { callModel } from "../modules/call/call.model";

export const callParticipantAuth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const call = await callModel.findById(req.params.callId);

    if (!call?.participants.some((p) => p.userId.equals(req.user._id))) {
        throw new ApiError(403, "Not a call participant");
    }

    next();
});
