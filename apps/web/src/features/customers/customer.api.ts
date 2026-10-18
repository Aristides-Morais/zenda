import { apiFetch } from "../../lib/api";
import type { Customer, PaginatedResponse } from "./types";

export function listCustomers(params: { q?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());

  return apiFetch<PaginatedResponse<Customer>>(
    `/api/v1/customers?${query.toString()}`
  );
}

export function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}) {
  return apiFetch<Customer>("/api/v1/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCustomer(
  id: string,
  input: {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
  }
) {
  return apiFetch<Customer>(`/api/v1/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(id: string) {
  return apiFetch<void>(`/api/v1/customers/${id}`, {
    method: "DELETE",
  });
}