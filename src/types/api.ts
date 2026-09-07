// Generic API Response wrapper expected from backend
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// You can add paginated responses, etc.
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
