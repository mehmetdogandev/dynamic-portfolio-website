'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import { useServerTableSearch } from '@/lib/hooks/use-server-table-search'

function useDebouncedColumnFilters(filters: ColumnFiltersState, delay = 300) {
  const [debounced, setDebounced] = useState(filters)

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(filters), delay)
    return () => clearTimeout(handler)
  }, [filters, delay])

  return debounced
}

export function columnFiltersToRecord(
  filters: ColumnFiltersState,
  filterKeyByColumnId: Record<string, string> = {}
): Record<string, string> {
  const record: Record<string, string> = {}
  for (const filter of filters) {
    if (typeof filter.value === 'string' && filter.value.trim()) {
      const key = filterKeyByColumnId[filter.id] ?? filter.id
      record[key] = filter.value.trim()
    }
  }
  return record
}

export interface UseAdminTableStateOptions<TSort extends string = string> {
  defaultPageSize?: number
  defaultSort?: { id: TSort; desc?: boolean }
  searchDebounceMs?: number
  syncSearchToUrl?: boolean
  searchParamKey?: string
  /** Maps table column filter ids to API columnFilters keys */
  columnFilterKeyMap?: Record<string, string>
}

export function useAdminTableState<const TSort extends string = string>(
  options: UseAdminTableStateOptions<TSort> = {} as UseAdminTableStateOptions<TSort>
) {
  const {
    defaultPageSize = 10,
    defaultSort = { id: 'createdAt' as TSort, desc: true },
    searchDebounceMs = 300,
    syncSearchToUrl = false,
    searchParamKey = 'search',
    columnFilterKeyMap = {},
  } = options

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: defaultSort.id, desc: defaultSort.desc ?? true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const debouncedColumnFilters = useDebouncedColumnFilters(columnFilters)

  const resetToFirstPage = useCallback(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    )
  }, [])

  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useServerTableSearch({
      debounceMs: searchDebounceMs,
      syncToUrl: syncSearchToUrl,
      paramKey: searchParamKey,
      onDebouncedChange: resetToFirstPage,
    })

  useEffect(() => {
    resetToFirstPage()
  }, [debouncedColumnFilters, resetToFirstPage])

  const handlePaginationChange = useCallback(
    (
      updater: PaginationState | ((old: PaginationState) => PaginationState)
    ) => {
      setPagination((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },
    []
  )

  const sortBy = sorting[0]?.id ?? defaultSort.id
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc'

  const columnFiltersRecord = useMemo(
    () => columnFiltersToRecord(debouncedColumnFilters, columnFilterKeyMap),
    [debouncedColumnFilters, columnFilterKeyMap]
  )

  const listInput = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: debouncedSearch || undefined,
      sortBy: sortBy as TSort,
      sortOrder: sortOrder as 'asc' | 'desc',
      columnFilters:
        Object.keys(columnFiltersRecord).length > 0
          ? columnFiltersRecord
          : undefined,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      sortBy,
      sortOrder,
      columnFiltersRecord,
    ]
  )

  const hasActiveFilters =
    Boolean(debouncedSearch) || Object.keys(columnFiltersRecord).length > 0

  return {
    pagination,
    setPagination,
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    debouncedSearch,
    handleSearchChange,
    clearSearch,
    columnFilters,
    setColumnFilters,
    debouncedColumnFilters,
    columnFiltersRecord,
    listInput,
    hasActiveFilters,
  }
}
