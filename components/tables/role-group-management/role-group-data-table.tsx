'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Edit, Plus, Shield, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema/rbac'
import { useTRPC } from '@/lib/trpc/client'
import { invalidateAuthRbacQueries } from '@/lib/trpc/invalidate-auth-rbac'
import { CreateRoleGroupDialog } from './create-role-group-dialog'
import { EditRoleGroupDialog } from './edit-role-group-dialog'
import { DeleteRoleGroupDialog } from './delete-role-group-dialog'
import type { Role, RoleGroup } from '@/lib/db/schema/rbac'

export interface EnhancedRoleGroup {
  id: string
  title: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
  roleCount?: number
  userCount?: number
  roles?: Array<{
    id: string
    name: string
    scope: string
    permissions: string[]
  }>
}

function RolePreview({
  roles,
}: {
  roles: Array<{
    id: string
    name: string
    scope: string
    permissions: string[]
  }>
}) {
  const [showAllRoles, setShowAllRoles] = useState(false)

  if (roles.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">Rol tanımlanmamış</span>
    )
  }

  const visibleRoles = showAllRoles ? roles : roles.slice(0, 3)
  const remainingCount = roles.length - 3

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1">
        {visibleRoles.map((role) => (
          <Tooltip key={role.id}>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-xs">
                {role.name}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p className="font-medium">{role.name}</p>
                <p className="text-sm">Kapsam: {role.scope}</p>
                <p className="text-sm">{role.permissions.length} izin</p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {!showAllRoles && remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 cursor-help px-2 text-xs"
                onClick={() => setShowAllRoles(true)}
              >
                +{remainingCount} daha
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs p-2">
              <div className="space-y-1">
                <p className="mb-1 text-[11px] font-semibold">Diğer Roller:</p>
                <div className="text-[10px] leading-relaxed">
                  {roles.slice(3).map((role, index) => (
                    <span key={role.id}>
                      {role.name}
                      {index < roles.slice(3).length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {showAllRoles && remainingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setShowAllRoles(false)}
        >
          Daha az göster
        </Button>
      )}
    </div>
  )
}

export function RoleGroupDataTable() {
  return <EnhancedRoleGroupDataTable />
}

export function EnhancedRoleGroupDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [editingRoleGroup, setEditingRoleGroup] =
    useState<EnhancedRoleGroup | null>(null)
  const [deletingRoleGroup, setDeletingRoleGroup] =
    useState<EnhancedRoleGroup | null>(null)

  const { data: canCreate } = usePermission(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.CREATE
  )
  const { data: canUpdate } = usePermission(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.ROLE_GROUP,
    PERMISSIONS.DELETE
  )

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState<'title' | 'createdAt'>({
    defaultPageSize: 10,
    defaultSort: { id: 'title', desc: false },
    syncSearchToUrl: true,
    searchParamKey: 'roleGroupSearch',
  })

  const queryListInput = useMemo(
    () => ({
      ...listInput,
      includeRoles: true as const,
    }),
    [listInput]
  )

  const { data: roleGroupsData, isLoading } = useQuery({
    ...trpc.roleGroup.list.queryOptions(queryListInput),
  })

  const { data: rolesData } = useQuery({
    ...trpc.role.list.queryOptions({
      page: 1,
      limit: 10000,
    }),
  })

  const createMutation = useMutation(
    trpc.roleGroup.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.roleGroup.list.queryKey(),
        })
        invalidateAuthRbacQueries(queryClient, trpc)
        toast.success('Rol grubu başarıyla oluşturuldu')
      },
      onError: (mutationError) => {
        toast.error(
          mutationError.message || 'Rol grubu oluşturulurken bir hata oluştu'
        )
      },
    })
  )

  const updateMutation = useMutation(
    trpc.roleGroup.update.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.roleGroup.list.queryKey(),
        })
        invalidateAuthRbacQueries(queryClient, trpc)
        toast.success('Rol grubu başarıyla güncellendi')
        setEditingRoleGroup(null)
      },
      onError: (mutationError) => {
        toast.error(
          mutationError.message || 'Rol grubu güncellenirken bir hata oluştu'
        )
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.roleGroup.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.roleGroup.list.queryKey(),
        })
        invalidateAuthRbacQueries(queryClient, trpc)
        toast.success('Rol grubu başarıyla silindi')
        setDeletingRoleGroup(null)
      },
      onError: (mutationError) => {
        toast.error(
          mutationError.message || 'Rol grubu silinirken bir hata oluştu'
        )
      },
    })
  )

  const roleGroups = (roleGroupsData?.data ?? []) as EnhancedRoleGroup[]
  const availableRoles = rolesData?.data ?? []

  const paginationMeta = roleGroupsData?.pagination
    ? {
        page: roleGroupsData.pagination.page,
        limit: roleGroupsData.pagination.limit,
        total: roleGroupsData.pagination.total,
        totalPages: roleGroupsData.pagination.totalPages,
      }
    : undefined

  const columns: ColumnDef<EnhancedRoleGroup>[] = useMemo(() => {
    const baseColumns: ColumnDef<EnhancedRoleGroup>[] = [
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title / Unvan',
        meta: { columnLabel: 'Unvan' },
        cell: ({ getValue, row }) => (
          <div>
            <div className="font-medium">{getValue() as string}</div>
            {row.original.description ? (
              <div className="text-muted-foreground text-sm">
                {row.original.description}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        id: 'roles',
        accessorKey: 'roles',
        header: 'Roller',
        enableSorting: false,
        meta: { columnLabel: 'Roller', disableColumnFilter: true },
        cell: ({ getValue }) => (
          <RolePreview
            roles={
              (getValue() || []) as Array<{
                id: string
                name: string
                scope: string
                permissions: string[]
              }>
            }
          />
        ),
      },
      {
        id: 'roleCount',
        accessorKey: 'roleCount',
        header: 'Rol Sayısı',
        enableSorting: false,
        meta: { columnLabel: 'Rol sayısı', disableColumnFilter: true },
        cell: ({ row }) => {
          const count =
            row.original.roles?.length || row.original.roleCount || 0
          return (
            <div className="flex items-center space-x-1">
              <Shield className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">{count}</span>
            </div>
          )
        },
      },
      {
        id: 'userCount',
        accessorKey: 'userCount',
        header: 'Kullanıcı Sayısı',
        enableSorting: false,
        meta: { columnLabel: 'Kullanıcı sayısı', disableColumnFilter: true },
        cell: ({ getValue }) => {
          const count = (getValue() as number) || 0
          return (
            <div className="flex items-center space-x-1">
              <Users className="text-muted-foreground h-4 w-4" />
              <span
                className={count > 0 ? 'font-medium' : 'text-muted-foreground'}
              >
                {count}
              </span>
            </div>
          )
        },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Oluşturulma',
        meta: { columnLabel: 'Oluşturulma' },
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string | number | Date)
          return (
            <span className="text-muted-foreground">
              {date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )
        },
      },
    ]

    if (canUpdate || canDelete) {
      baseColumns.push(
        createIconActionColumn<EnhancedRoleGroup>((row) => {
          const actions = []
          if (canUpdate) {
            actions.push({
              icon: Edit,
              label: 'Düzenle',
              onClick: () => setEditingRoleGroup(row.original),
            })
          }
          if (canDelete) {
            actions.push({
              icon: Trash2,
              label: 'Sil',
              variant: 'destructive' as const,
              onClick: () => setDeletingRoleGroup(row.original),
            })
          }
          return actions
        })
      )
    }

    return baseColumns
  }, [canUpdate, canDelete])

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={roleGroups}
        searchPlaceholder="Rol gruplarında ara..."
        pagination={paginationMeta}
        onPaginationChange={handlePaginationChange}
        globalFilter={search}
        onGlobalFilterChange={handleSearchChange}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        autoHideEmptyColumns={false}
        toolbarAdd={
          canCreate ? (
            <CreateRoleGroupDialog
              availableRoles={availableRoles as Role[]}
              onSubmit={async (data) => {
                await createMutation.mutateAsync(data)
              }}
              trigger={
                <Button type="button" size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Yeni rol grubu
                </Button>
              }
            />
          ) : null
        }
      />

      {editingRoleGroup ? (
        <EditRoleGroupDialog
          open={!!editingRoleGroup}
          onOpenChange={(open) => !open && setEditingRoleGroup(null)}
          roleGroup={
            editingRoleGroup as RoleGroup & {
              roles?: { id: string }[]
            }
          }
          availableRoles={availableRoles as Role[]}
          onSubmit={async (id, data) => {
            await updateMutation.mutateAsync({ id, ...data })
          }}
        />
      ) : null}

      {deletingRoleGroup ? (
        <DeleteRoleGroupDialog
          open={!!deletingRoleGroup}
          onOpenChange={(open) => !open && setDeletingRoleGroup(null)}
          roleGroup={
            deletingRoleGroup as RoleGroup & {
              userCount?: number
              roleCount?: number
            }
          }
          onConfirm={async (id) => {
            await deleteMutation.mutateAsync({ id })
          }}
        />
      ) : null}
    </div>
  )
}
