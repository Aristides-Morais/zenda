import { z } from "zod";

export const createExpenseSchema = z.object({
  description: z.string().trim().min(2, "Descrição muito curta").max(200),
  amount: z.coerce.number().positive("O valor deve ser maior que zero"),
  category: z.string().trim().min(2, "Categoria inválida").max(50),
  date: z.coerce.date(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpensesQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;