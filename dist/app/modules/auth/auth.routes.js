"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_controllers_1 = require("./auth.controllers");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
router.post("/register", (0, validateRequest_1.default)(auth_validation_1.validationUser.userValidationSchema), auth_controllers_1.userController.createUser);
router.post("/login", auth_controllers_1.userController.loginUser);
router.post("/refresh-token", auth_controllers_1.userController.refreshAccessToken);
exports.authRoutes = router;
