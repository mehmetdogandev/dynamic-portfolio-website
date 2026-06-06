'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2 } from 'lucide-react'
import type { Role } from '@/lib/db/schema/rbac'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface RoleSelectorDataTableProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  pageSize?: number
  scope?: Role['scope']
}

export function RoleSelectorDataTable({
  selectedIds,
  onChange,
  pageSize = 10,
  scope,
}: RoleSelectorDataTableProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [page, setPage] = useState<number>(1)
  const limit = pageSize
  const [search, setSearch] = useState<string>('')

  // Fetch roles from server with pagination and search
  const { data, isLoading } = useQuery({
    ...trpc.role.list.queryOptions({
      page,
      limit,
      search: search || undefined,
      scope: scope || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    }),
  })

  useEffect(() => {
    // reset to first page when pageSize or search changes
    setPage(1)
  }, [pageSize, search])

  const roles = data?.data || []
  const total = data?.pagination?.total || 0

  // Mutation to fetch all matching roles (ignoring pagination)
  const selectAllMutation = useMutation({
    mutationFn: async () => {
      // Fetch all matching roles with a very high limit
      const queryOptions = trpc.role.list.queryOptions({
        page: 1,
        limit: 10000, // Very high limit to get all results
        search: search || undefined,
        scope: scope || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      const result = await queryClient.fetchQuery(queryOptions)
      return result.data || []
    },
    onSuccess: (allMatchingRoles) => {
      const ids = allMatchingRoles
        .map((r) => r.id)
        .filter((id): id is string => Boolean(id))
      onChange(Array.from(new Set([...selectedIds, ...ids])))
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      // Fetch all matching roles with a very high limit
      const queryOptions = trpc.role.list.queryOptions({
        page: 1,
        limit: 10000, // Very high limit to get all results
        search: search || undefined,
        scope: scope || undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      const result = await queryClient.fetchQuery(queryOptions)
      return result.data || []
    },
    onSuccess: (allMatchingRoles) => {
      const visibleIds = new Set(
        allMatchingRoles
          .map((r) => r.id)
          .filter((id): id is string => Boolean(id))
      )
      onChange(selectedIds.filter((id) => !visibleIds.has(id)))
    },
  })

  const toggle = (id: string) => {
    const exists = selectedIds.includes(id)
    const next = exists
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id]
    onChange(next)
  }

  const selectAllVisible = () => {
    selectAllMutation.mutate()
  }

  const clearVisible = () => {
    clearAllMutation.mutate()
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  // Dynamic button labels based on search
  const selectAllLabel = search.trim()
    ? `"${search.trim()}" tümünü seç`
    : 'Tümünü Seç'
  const clearAllLabel = search.trim()
    ? `"${search.trim()}" tümünü kaldır`
    : 'Tümünü Kaldır'

  return (
    <div className="min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rollerde ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full sm:w-56 pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={selectAllVisible}
            disabled={selectAllMutation.isPending || isLoading}
          >
            {selectAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              selectAllLabel
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearVisible}
            disabled={clearAllMutation.isPending || isLoading}
          >
            {clearAllMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Yükleniyor...
              </>
            ) : (
              clearAllLabel
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[420px] border rounded-md overflow-x-auto">
        <div className="min-w-0">
          <table className="w-full table-fixed min-w-[480px] sm:min-w-[600px]">
            <thead>
              <tr className="text-left text-[10px] sm:text-xs text-muted-foreground">
                <th className="w-8 sm:w-12 p-1 sm:p-2"> </th>
                <th className="p-1 sm:p-2">Rol Adı</th>
                <th className="p-1 sm:p-2 w-24 sm:w-36">Kapsam</th>
                <th className="p-1 sm:p-2 w-20 sm:w-28">İzinler</th>
                <th className="p-1 sm:p-2 w-16 sm:w-24">Kullanıcılar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground"
                  >
                    Yükleniyor...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-2 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground"
                  >
                    Sonuç bulunamadı
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b last:border-b-0">
                    <td className="p-1 sm:p-2">
                      <Checkbox
                        checked={selectedIds.includes(role.id)}
                        onCheckedChange={() => toggle(role.id)}
                        className="h-3 w-3 sm:h-4 sm:w-4"
                      />
                    </td>
                    <td className="p-1 sm:p-2">
                      <div className="font-medium truncate text-xs sm:text-sm">
                        {role.name ?? ''}
                      </div>
                    </td>
                    <td className="p-1 sm:p-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] sm:text-[11px] uppercase px-1 sm:px-2 py-0.5"
                      >
                        {role.scope ?? ''}
                      </Badge>
                    </td>
                    <td className="p-1 sm:p-2">
                      <div className="flex flex-wrap gap-0.5 sm:gap-1">
                        {(role.permissions || [])
                          .slice(0, 2)
                          .map((p: string) => (
                            <Badge
                              key={p}
                              variant="secondary"
                              className="text-[9px] sm:text-[11px] px-1 py-0"
                            >
                              {p}
                            </Badge>
                          ))}
                        {(role.permissions || []).length > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] sm:text-[11px] px-1 py-0"
                          >
                            +{(role.permissions || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-1 sm:p-2">
                      <div className="text-xs sm:text-sm">
                        {role.userCount ?? 0}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-muted-foreground">Toplam: {total} rol</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Önceki
          </Button>
          <div className="text-sm">
            {page} / {totalPages}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}
