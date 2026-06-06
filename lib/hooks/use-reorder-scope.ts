'use client'

import { useQuery } from '@tanstack/react-query'

type ReorderScopeConfig = {
  enabled: boolean
  queryKey: readonly unknown[]
  queryFn: () => Promise<{ id: string }[]>
}

/**
 * Loads full ordered ids for the current reorder scope (e.g. all rows in a group).
 * Disable row reorder DnD when `hasActiveFilters` is true on the parent table.
 */
export function useReorderScope(config: ReorderScopeConfig) {
  const { enabled, queryKey, queryFn } = config

  const { data: scopeRows, isLoading } = useQuery({
    queryKey: [...queryKey, 'reorder-scope'],
    queryFn,
    enabled,
    staleTime: 30_000,
  })

  const orderedIds = scopeRows?.map((row) => row.id) ?? []

  return {
    orderedIds,
    isLoadingScope: isLoading,
  }
}

export function useReorderScopeDisabled(hasActiveFilters: boolean) {
  return hasActiveFilters
}
