import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {
  createSaleSchema,
  listSalesQuerySchema,
} from "./sale.schemas.js";
import { createSale, getSale, listSales } from "./sale.service.js";

export const saleRouter = Router();

saleRouter.use(requireAuth);
saleRouter.use(requireBusiness);

saleRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit } = listSalesQuerySchema.parse(req.query);
    const result = await listSales(req.businessId!, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

saleRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await getSale(req.businessId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

saleRouter.post("/", async (req, res, next) => {
  try {
    const input = createSaleSchema.parse(req.body);
    const result = await createSale(req.businessId!, req.user!.sub, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});