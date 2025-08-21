import { userModel } from "../modules/auth/auth.model";

export async function userNameGenerator(fullName: string): Promise<string> {
    const baseName = fullName.toLowerCase().replace(/\s+/g, "");
    const existingUsers = await userModel
        .find({
            username: new RegExp(`^${baseName}(\\d*)$`),
        })
        .sort({ username: -1 });

    if (existingUsers.length === 0) {
        return baseName;
    }

    const latest = existingUsers[0].username;
    const lastNumber = parseInt(latest.replace(baseName, "")) || 0;

    return `${baseName}${lastNumber + 1}`;
}
