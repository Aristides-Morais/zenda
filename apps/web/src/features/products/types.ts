export type Product = {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};