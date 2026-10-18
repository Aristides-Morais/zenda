import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "./expense.schemas.js";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "./expense.service.js";

export const expenseRouter = Router();

expenseRouter.use(requireAuth);
expenseRouter.use(requireBusiness);

expenseRouter.get("/", async (req, res, next) => {
  try {
    const { q, page, limit } = listExpensesQuerySchema.parse(req.query);
    const result = await listExpenses(req.businessId!, q, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

expenseRouter.post("/", async (req, res, next) => {
  try {
    const input = createExpenseSchema.parse(req.body);
    const result = await createExpense(req.businessId!, req.user!.sub, input);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

expenseRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateExpenseSchema.parse(req.body);
    const result = await updateExpense(req.businessId!, req.params.id, input);
    res.json(result);
  } catch (err) { next(err); }
});

expenseRouter.delete("/:id", async (req, res, next) => {
  try {
    await deleteExpense(req.businessId!, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});