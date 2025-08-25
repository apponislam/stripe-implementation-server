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
Object.defineProperty(exports, "__esModule", { value: true });
exports.userNameGenerator = userNameGenerator;
const auth_model_1 = require("../modules/auth/auth.model");
function userNameGenerator(fullName) {
    return __awaiter(this, void 0, void 0, function* () {
        const baseName = fullName.toLowerCase().replace(/\s+/g, "");
        const existingUsers = yield auth_model_1.userModel
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
    });
}
