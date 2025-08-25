"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controllers_1 = require("./user.controllers");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const router = express_1.default.Router();
router.get("/me", auth_1.default, user_controllers_1.userControllers.getMyProfile);
router.get("/", auth_1.default, user_controllers_1.userControllers.getAllUsers);
router.get("/:id", auth_1.default, user_controllers_1.userControllers.getUserById);
exports.userRoutes = router;
