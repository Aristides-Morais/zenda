export type Summary = {
  todaySales: number;
  monthSales: number;
  monthExpenses: number;
  estimatedProfit: number;
  todaySalesCount: number;
};

export type SalesChartPoint = {
  date: string;
  total: number;
  count: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  minStock: number;
};