import { apiFetch } from "../../lib/api";
import type { PaginatedResponse, Product } from "./types";

export function listProducts(params: { q?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  return apiFetch<PaginatedResponse<Product>>(
    `/api/v1/products?${query.toString()}`
  );
}

export function createProduct(input: {
  name: string;
  sku?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
}) {
  return apiFetch<Product>("/api/v1/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  id: string,
  input: {
    name?: string;
    sku?: string;
    price?: number;
    cost?: number;
    stock?: number;
    minStock?: number;
  }
) {
  return apiFetch<Product>(`/api/v1/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProduct(id: string) {
  return apiFetch<void>(`/api/v1/products/${id}`, {
    method: "DELETE",
  });
}