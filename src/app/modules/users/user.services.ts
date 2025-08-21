import userModel from "../auth/auth.model";

const getMyProfileFromDB = async (userId: string) => {
    return await getUserByIdFromDB(userId);
};

const getAllUsersFromDB = async () => {
    const users = await userModel.find().select("-password");
    return users;
};

const getUserByIdFromDB = async (userId: string) => {
    const user = await userModel.findById(userId).select("-password");
    return user;
};

export const userServices = {
    getMyProfileFromDB,
    getAllUsersFromDB,
    getUserByIdFromDB,
};
