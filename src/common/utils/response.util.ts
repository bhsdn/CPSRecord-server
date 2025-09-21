// 通用的分页返回结构
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPaginationResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  // 计算总页数，保证至少为 1
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
  };
}
