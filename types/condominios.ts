export interface CondominiosFilters {
  search?: string;
  isActive?: boolean;
  subscriptionPlan?: string;
  city?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

