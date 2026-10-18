export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: { name: string; sku: string | null };
};

export type Sale = {
  id: string;
  businessId: string;
  userId: string;
  customerId: string | null;
  total: number;
  status: string;
  createdAt: string;
  customer?: { name: string } | null;
  user?: { name: string };
  items?: SaleItem[];
  _count?: { items: number };
};

export type PaginatedSales = {
  data: Sale[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};