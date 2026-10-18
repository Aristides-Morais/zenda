import { checkProductLimit } from "../../middleware/limit.middleware.js";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "./product.schemas.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "./product.service.js";

export const productRouter = Router();

productRouter.use(requireAuth);
productRouter.use(requireBusiness);

productRouter.get("/", async (req, res, next) => {
  try {
    const { q, page, limit } = listProductsQuerySchema.parse(req.query);
    const result = await listProducts(req.businessId!, q, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

productRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await getProduct(req.businessId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

productRouter.post("/", checkProductLimit(), async (req, res, next) => {
  try {
    const input = createProductSchema.parse(req.body);
    const result = await createProduct(req.businessId!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

productRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateProductSchema.parse(req.body);
    const result = await updateProduct(req.businessId!, req.params.id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

productRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteProduct(req.businessId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});