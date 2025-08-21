import { Router } from "express";
import { productController } from "./product.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createProductSchema, updateProductSchema } from "./product.validation";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth, validateRequest(createProductSchema), productController.createProduct);
router.get("/my-products", auth, productController.getMyProducts);
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", auth, validateRequest(updateProductSchema), productController.updateProduct);
router.delete("/:id", auth, productController.deleteProduct);

export const productRoutes = router;
