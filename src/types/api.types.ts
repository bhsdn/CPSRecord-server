export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;
  timestamp: string;
  error?: string;
  path?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
