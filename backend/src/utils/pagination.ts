import { Request } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  offset: number;
  total?: number;
  totalPages?: number;
}

export function getPagination(req: Request, defaultLimit = 20): PaginationMeta {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  meta: PaginationMeta,
) {
  return {
    data,
    pagination: {
      page: meta.page,
      limit: meta.limit,
      total,
      totalPages: Math.ceil(total / meta.limit),
      hasNext: meta.page < Math.ceil(total / meta.limit),
      hasPrev: meta.page > 1,
    },
  };
}
