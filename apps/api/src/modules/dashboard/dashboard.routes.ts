import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {
  getLowStock,
  getSalesChart,
  getSummary,
  getTopProducts,
} from "./dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requireBusiness);

dashboardRouter.get("/summary", async (req, res, next) => {
  try {
    const data = await getSummary(req.businessId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/sales-chart", async (req, res, next) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
    const data = await getSalesChart(req.businessId!, days);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/top-products", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const data = await getTopProducts(req.businessId!, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/low-stock", async (req, res, next) => {
  try {
    const data = await getLowStock(req.businessId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
});