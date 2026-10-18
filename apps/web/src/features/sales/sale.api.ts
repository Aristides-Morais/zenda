import { apiFetch } from "../../lib/api";
import type { PaginatedSales, Sale } from "./types";

export function listSales(params: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  return apiFetch<PaginatedSales>(`/api/v1/sales?${query.toString()}`);
}

export function createSale(input: {
  customerId?: string;
  items: { productId: string; quantity: number }[];
}) {
  return apiFetch<Sale>("/api/v1/sales", {
    method: "POST",
    body: JSON.stringify(input),
  });
}