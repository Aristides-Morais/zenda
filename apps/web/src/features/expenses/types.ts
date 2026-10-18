export type Expense = {
  id: string;
  businessId: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
};

export type PaginatedExpenses = {
  data: Expense[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};