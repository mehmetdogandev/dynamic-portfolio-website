'use client'

import React, { useState, useRef, memo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import { invalidateAuthRbacQueries } from '@/lib/trpc/invalidate-auth-rbac'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Search, Check, X, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

// Local types matching backend shapes returned by TRPC
type RoleWithInfo = {
  id: string
  name: string
  scope: string
  permissions: string[]
}

type RoleGroupWithRoles = {
  id: string
  title: string
  description?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
  roles?: RoleWithInfo[]
}

interface AssignRoleGroupProps {
  userId: string
}

export const AssignRoleGroup = memo(function AssignRoleGroup({
  userId,
}: AssignRoleGroupProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Fetch available role groups (include roles for hover preview)
  const { data: roleGroupsData, isLoading: isLoadingGroups } = useQuery({
    ...trpc.roleGroup.list.queryOptions({
      page: 1,
      limit: 10000,
      includeRoles: true,
    }),
  })

  // Fetch role groups assigned to the user
  const { data: assignedGroupsData, isLoading: isLoadingAssigned } = useQuery({
    ...trpc.user.getRoleGroupsFor.queryOptions({ userId }),
  })

  const assignMutation = useMutation(
    trpc.roleGroup.assignToUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.getRoleGroupsFor.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.roleGroup.list.queryKey(),
        })
        try {
          queryClient.invalidateQueries({
            queryKey: trpc.user.getById.queryKey({ id: userId }),
          })
        } catch (_) {}
        invalidateAuthRbacQueries(queryClient, trpc)
        toast.success('Rol grubu kullanıcıya atandı')
      },
      onError: (err: unknown) => {
        let message = 'Rol grubu atama hatası'
        if (err instanceof Error) {
          message = err.message
        } else if (
          typeof err === 'object' &&
          err !== null &&
          'message' in err
        ) {
          const m = (err as { message: unknown }).message
          if (typeof m === 'string') message = m
        }
        toast.error(message)
      },
    })
  )

  const removeMutation = useMutation(
    trpc.roleGroup.removeFromUser.mutationOptions({
      onSuccess: (data: unknown) => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.getRoleGroupsFor.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.roleGroup.list.queryKey(),
        })
        try {
          queryClient.invalidateQueries({
            queryKey: trpc.user.getById.queryKey({ id: userId }),
          })
        } catch (_) {}
        invalidateAuthRbacQueries(queryClient, trpc)
        const res = data as { messages?: string[] } | undefined
        if (res?.messages && Array.isArray(res.messages)) {
          toast.success(res.messages.join(' — '))
        } else {
          toast.success('Rol grubu kullanıcıdan çıkarıldı')
        }
      },
      onError: (err: unknown) => {
        let message = 'Rol grubu çıkarma hatası'
        if (err instanceof Error) {
          message = err.message
        } else if (
          typeof err === 'object' &&
          err !== null &&
          'message' in err
        ) {
          const m = (err as { message: unknown }).message
          if (typeof m === 'string') message = m
        }
        toast.error(message)
      },
    })
  )

  const rawRoleGroups = (roleGroupsData?.data ?? []) as unknown[]
  const roleGroups: RoleGroupWithRoles[] = rawRoleGroups
    .filter(
      (rg): rg is Record<string, unknown> =>
        typeof rg === 'object' &&
        rg !== null &&
        typeof (rg as Record<string, unknown>).id === 'string'
    )
    .map((rg) => {
      const rec = rg as Record<string, unknown>
      const rolesRaw = Array.isArray(rec.roles) ? (rec.roles as unknown[]) : []
      const roles: RoleWithInfo[] = rolesRaw
        .filter(
          (r): r is Record<string, unknown> =>
            typeof r === 'object' &&
            r !== null &&
            typeof (r as Record<string, unknown>).id === 'string'
        )
        .map((rRec) => {
          const rr = rRec as Record<string, unknown>
          const permsRaw = rr.permissions
          const permissions: string[] = Array.isArray(permsRaw)
            ? (permsRaw as unknown[]).map((p) => String(p))
            : []

          return {
            id: String(rr.id),
            name: String(rr.name ?? ''),
            scope: String(rr.scope ?? ''),
            permissions,
          }
        })

      return {
        id: String(rec.id),
        title: String(rec.title ?? ''),
        description: rec.description == null ? null : String(rec.description),
        createdAt: rec.createdAt as string | Date | undefined,
        updatedAt: rec.updatedAt as string | Date | undefined,
        roles,
      }
    })

  const rawAssigned = (assignedGroupsData ?? []) as unknown[]
  const assignedGroups: RoleGroupWithRoles[] = rawAssigned
    .filter(
      (rg): rg is Record<string, unknown> =>
        typeof rg === 'object' &&
        rg !== null &&
        typeof (rg as Record<string, unknown>).id === 'string'
    )
    .map(
      (rg) =>
        ({
          id: String((rg as Record<string, unknown>).id),
          title: String((rg as Record<string, unknown>).title ?? ''),
          description:
            (rg as Record<string, unknown>).description == null
              ? null
              : String((rg as Record<string, unknown>).description),
        }) as RoleGroupWithRoles
    )

  const assignedIds = new Set(assignedGroups.map((g) => g.id))

  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const listRef = useRef<HTMLDivElement | null>(null)

  const handleAssign = async (roleGroupId: string) => {
    setAssigningId(roleGroupId)
    try {
      await assignMutation.mutateAsync({ userId, roleGroupId })
    } finally {
      setAssigningId(null)
    }
  }

  const handleRemove = async (roleGroupId: string) => {
    setRemovingId(roleGroupId)
    try {
      await removeMutation.mutateAsync({ userId, roleGroupId })
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoadingGroups || isLoadingAssigned) {
    return <div>Yükleniyor...</div>
  }

  const filteredGroups = (() => {
    const q = searchTerm.trim().toLowerCase()
    const matched = roleGroups.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.description ?? '').toLowerCase().includes(q)
    )

    // Helper to get timestamp (fallback 0)
    const ts = (g: (typeof roleGroups)[number]) => {
      const v = g.createdAt as string | Date | undefined
      const t =
        typeof v === 'string'
          ? Date.parse(v)
          : v instanceof Date
            ? v.getTime()
            : 0
      return Number.isNaN(t) ? 0 : t
    }

    if (q === '') {
      // No search: newest first
      return matched.slice().sort((a, b) => ts(b) - ts(a))
    }

    // With search: sort by title relevance (index), then newest first
    return matched.slice().sort((a, b) => {
      const titleA = a.title.toLowerCase()
      const titleB = b.title.toLowerCase()
      const idxA = titleA.indexOf(q)
      const idxB = titleB.indexOf(q)
      const ia = idxA === -1 ? 9999 : idxA
      const ib = idxB === -1 ? 9999 : idxB
      if (ia !== ib) return ia - ib
      return ts(b) - ts(a)
    })
  })()

  const assignedList = roleGroups.filter((g) => assignedIds.has(g.id))

  const toggleGroup = async (groupId: string) => {
    if (assignedIds.has(groupId)) {
      await handleRemove(groupId)
    } else {
      await handleAssign(groupId)
    }
  }

  const handleSelectAll = async () => {
    const unassignedGroups = filteredGroups.filter(
      (g) => !assignedIds.has(g.id)
    )
    if (unassignedGroups.length === 0) return

    // Assign all unassigned groups
    for (const group of unassignedGroups) {
      await handleAssign(group.id)
    }
  }

  const handleRemoveAll = async () => {
    const assignedGroups = filteredGroups.filter((g) => assignedIds.has(g.id))
    if (assignedGroups.length === 0) return

    // Remove all assigned groups
    for (const group of assignedGroups) {
      await handleRemove(group.id)
    }
  }

  const hasUnassignedInResults = filteredGroups.some(
    (g) => !assignedIds.has(g.id)
  )
  const hasAssignedInResults = filteredGroups.some((g) => assignedIds.has(g.id))

  return (
    <div className="space-y-4">
      {/* Search input at top */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Rol grubu ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Select All and Remove All buttons */}
      {filteredGroups.length > 0 &&
        (hasUnassignedInResults || hasAssignedInResults) && (
          <div className="flex justify-end gap-2">
            {hasUnassignedInResults && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8"
              >
                {searchTerm.trim() !== ''
                  ? `"${searchTerm.trim()}" Tümü`
                  : 'Tümü'}
              </Button>
            )}
            {hasAssignedInResults && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAll}
                className="h-8 text-destructive hover:text-destructive"
              >
                {searchTerm.trim() !== ''
                  ? `"${searchTerm.trim()}" Kaldır`
                  : 'Kaldır'}
              </Button>
            )}
          </div>
        )}

      {/* Selected groups summary */}
      {assignedList.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          {assignedList.map((g) => (
            <Badge
              key={g.id}
              variant="secondary"
              className="text-xs flex items-center gap-2"
            >
              <span className="truncate max-w-[160px]">{g.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemove(g.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Scrollable list - always visible */}
      <div className="border rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div
          className="overflow-y-auto"
          style={{ maxHeight: '400px' }}
          ref={listRef}
        >
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Hiçbir rol grubu bulunamadı.</p>
            </div>
          ) : (
            filteredGroups.map((g, index) => {
              const isAssigned = assignedIds.has(g.id)
              return (
                <div
                  key={g.id}
                  onClick={() => toggleGroup(g.id)}
                  className={`flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isAssigned ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${index !== filteredGroups.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        isAssigned
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      {isAssigned && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium text-sm ${
                          isAssigned
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {g.title}
                      </div>
                      {g.description && (
                        <div
                          className={`text-xs ${
                            isAssigned
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {g.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="text-xs cursor-help"
                        >
                          {g.roles?.length ?? 0} rol
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 max-w-xs">
                          {(g.roles ?? []).length === 0 ? (
                            <div className="text-sm text-muted-foreground">
                              Rol bulunamadı
                            </div>
                          ) : (
                            (g.roles ?? []).map((r) => (
                              <div key={r.id} className="text-sm">
                                <div className="font-medium">{r.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Kapsam: {r.scope}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    <div className="w-6 h-6 flex items-center justify-center">
                      {assigningId === g.id || removingId === g.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                      ) : (
                        isAssigned && (
                          <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
})
