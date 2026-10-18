import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customer.schemas.js";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customer.service.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);
customerRouter.use(requireBusiness);

customerRouter.get("/", async (req, res, next) => {
  try {
    const { q, page, limit } = listCustomersQuerySchema.parse(req.query);
    const result = await listCustomers(req.businessId!, q, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

customerRouter.get("/:id", async (req, res, next) => {
  try {
    const result = await getCustomer(req.businessId!, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

customerRouter.post("/", async (req, res, next) => {
  try {
    const input = createCustomerSchema.parse(req.body);
    const result = await createCustomer(req.businessId!, input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

customerRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateCustomerSchema.parse(req.body);
    const result = await updateCustomer(req.businessId!, req.params.id, input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

customerRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteCustomer(req.businessId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});