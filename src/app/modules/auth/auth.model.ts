import { Model, Schema, model } from "mongoose";
import { TUser } from "./auth.interface";
import bcrypt from "bcrypt";
import config from "../../config";

interface UserModel extends Model<TUser> {
    isPasswordMatched(plainTextPassword: string, hashedPassword: string): Promise<boolean>;
}

const userSchema = new Schema<TUser>(
    {
        name: { type: String, required: [true, "Name is required"] },
        username: { type: String, unique: true },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
        },
        password: { type: String, required: [true, "Password is required"] },
        avatarUrl: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, Number(config.bcrypt_salt_rounds));
    next();
});

userSchema.post("save", function (doc, next) {
    doc.password = "";
    next();
});

userSchema.statics.isPasswordMatched = async function (plainTextPassword: string, hashedPassword: string) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const userModel = model<TUser>("User", userSchema);

export default userModel as Model<TUser> & {
    isPasswordMatched: (plainTextPassword: string, hashedPassword: string) => Promise<boolean>;
};
