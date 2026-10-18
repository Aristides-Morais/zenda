import { apiFetch } from "../../lib/api";
import type { Expense, PaginatedExpenses } from "./types";

export function listExpenses(params: { q?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  return apiFetch<PaginatedExpenses>(`/api/v1/expenses?${query.toString()}`);
}

export function createExpense(input: {
  description: string;
  amount: number;
  category: string;
  date: string;
}) {
  return apiFetch<Expense>("/api/v1/expenses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateExpense(
  id: string,
  input: { description?: string; amount?: number; category?: string; date?: string }
) {
  return apiFetch<Expense>(`/api/v1/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteExpense(id: string) {
  return apiFetch<void>(`/api/v1/expenses/${id}`, { method: "DELETE" });
}