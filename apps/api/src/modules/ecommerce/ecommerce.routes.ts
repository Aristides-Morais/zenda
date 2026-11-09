import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { checkoutLimiter } from "../../middleware/limit.middleware.js";
import {
  checkoutSchema,
  createCategorySchema,
  createEcomProductSchema,
} from "./ecommerce.schemas.js";
import {
  createCategory,
  createEcomProduct,
  getPublicStore,
  listAdminProducts,
  listOrders,
  processCheckout,
  updateOrderStatus,
} from "./ecommerce.service.js";

// ==========================================
// ROTAS PÚBLICAS (Para os clientes da loja)
// ==========================================
export const storeRouter = Router();

storeRouter.get("/:businessId", async (req, res, next) => {
  try {
    const data = await getPublicStore(req.params.businessId);
    res.json(data);
  } catch (err) { next(err); }
});

storeRouter.post("/checkout", checkoutLimiter, async (req, res, next) => {
  try {
    const input = checkoutSchema.parse(req.body);
    const order = await processCheckout(input);
    res.status(201).json(order);
  } catch (err) { next(err); }
});

// ==========================================
// ROTAS PRIVADAS (Para o Admin da loja)
// ==========================================
export const ecomAdminRouter = Router();

ecomAdminRouter.use(requireAuth);
ecomAdminRouter.use(requireBusiness);
ecomAdminRouter.use(requireRole(["OWNER", "MANAGER"]));

ecomAdminRouter.post("/categories", async (req, res, next) => {
  try {
    const { name } = createCategorySchema.parse(req.body);
    const result = await createCategory(req.businessId!, name);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

ecomAdminRouter.get("/products", async (req, res, next) => {
  try {
    const result = await listAdminProducts(req.businessId!);
    res.json(result);
  } catch (err) { next(err); }
});

ecomAdminRouter.post("/products", async (req, res, next) => {
  try {
    const input = createEcomProductSchema.parse(req.body);
    const result = await createEcomProduct(req.businessId!, input);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

ecomAdminRouter.get("/orders", async (req, res, next) => {
  try {
    const result = await listOrders(req.businessId!);
    res.json(result);
  } catch (err) { next(err); }
});

ecomAdminRouter.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const schema = z.object({
      status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
    });
    const { status } = schema.parse(req.body);
    const result = await updateOrderStatus(req.businessId!, req.params.id, status);
    res.json(result);
  } catch (err) { next(err); }
});