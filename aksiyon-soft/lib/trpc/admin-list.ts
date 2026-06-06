import { z } from 'zod/v4'

export const adminListInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  columnFilters: z.record(z.string(), z.string()).optional(),
})

export type AdminListInput = z.infer<typeof adminListInputSchema>

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    page,
    limit,
    total,
    totalPages,
  }
}

export function paginatedListResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: buildPaginationMeta(total, page, limit),
  }
}

/** Fetch all rows for selects/dropdowns (within server max limit). */
export function adminListFetchAllInput<const T extends string>(sortBy: T) {
  return {
    page: 1,
    limit: 10000,
    sortBy,
    sortOrder: 'asc' as const,
  }
}
