import express from "express";
import { userController } from "./auth.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { validationUser } from "./auth.validation";

const router = express.Router();

router.post("/register", validateRequest(validationUser.userValidationSchema), userController.createUser);
router.post("/login", userController.loginUser);
router.post("/refresh-token", userController.refreshAccessToken);
router.post("/logout", userController.logoutUser);

export const authRoutes = router;
