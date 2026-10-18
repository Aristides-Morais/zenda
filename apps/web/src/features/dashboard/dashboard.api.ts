import { apiFetch } from "../../lib/api";
import type {
  LowStockProduct,
  SalesChartPoint,
  Summary,
  TopProduct,
} from "./types";

export function getSummary() {
  return apiFetch<Summary>("/api/v1/dashboard/summary");
}

export function getSalesChart(days = 30) {
  return apiFetch<SalesChartPoint[]>(
    `/api/v1/dashboard/sales-chart?days=${days}`
  );
}

export function getTopProducts(limit = 5) {
  return apiFetch<TopProduct[]>(
    `/api/v1/dashboard/top-products?limit=${limit}`
  );
}

export function getLowStock() {
  return apiFetch<LowStockProduct[]>("/api/v1/dashboard/low-stock");
}