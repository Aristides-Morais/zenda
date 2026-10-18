import { prisma } from "../../lib/prisma.js";
import type { CreateExpenseInput, UpdateExpenseInput } from "./expense.schemas.js";

export class ExpenseError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ExpenseError";
  }
}

export async function listExpenses(
  businessId: string,
  q?: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    ...(q
      ? {
          OR: [
            { description: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: items.map((e) => ({ ...e, amount: Number(e.amount) })),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function createExpense(
  businessId: string,
  userId: string,
  input: CreateExpenseInput
) {
  const expense = await prisma.expense.create({
    data: {
      businessId,
      userId,
      description: input.description,
      amount: input.amount,
      category: input.category,
      date: input.date,
    },
  });
  return { ...expense, amount: Number(expense.amount) };
}

export async function updateExpense(
  businessId: string,
  id: string,
  input: UpdateExpenseInput
) {
  const existing = await prisma.expense.findFirst({
    where: { id, businessId },
  });

  if (!existing) throw new ExpenseError("NOT_FOUND", "Despesa não encontrada", 404);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(input.description !== undefined && { description: input.description }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.date !== undefined && { date: input.date }),
    },
  });
  return { ...expense, amount: Number(expense.amount) };
}

export async function deleteExpense(businessId: string, id: string) {
  const existing = await prisma.expense.findFirst({
    where: { id, businessId },
  });

  if (!existing) throw new ExpenseError("NOT_FOUND", "Despesa não encontrada", 404);

  await prisma.expense.delete({ where: { id } });
}