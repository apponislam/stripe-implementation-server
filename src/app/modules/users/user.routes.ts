import express from "express";
import { userControllers } from "./user.controllers";
import auth from "../../middlewares/auth";
const router = express.Router();

router.get("/me", auth, userControllers.getMyProfile);
router.get("/", auth, userControllers.getAllUsers);
router.get("/:id", auth, userControllers.getUserById);

export const userRoutes = router;
