import { Request } from "express";

export function getPagination(query: Request["query"], defaultLimit = 100, maxLimit = 200) {
  const requestedLimit = Number(query.limit);
  const requestedPage = Number(query.page);
  const limit = Number.isFinite(requestedLimit) ? Math.min(maxLimit, Math.max(1, Math.trunc(requestedLimit))) : defaultLimit;
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.trunc(requestedPage)) : 1;
  return { limit, page, skip: (page - 1) * limit };
}

export function paginationMeta(page: number, limit: number, returned: number) {
  return { page, limit, returned, hasMore: returned === limit };
}
