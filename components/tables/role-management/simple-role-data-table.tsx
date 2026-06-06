'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { useTRPC } from '@/lib/trpc/client'
import { invalidateAuthRbacQueries } from '@/lib/trpc/invalidate-auth-rbac'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CreateRoleDialog } from './create-role-dialog'
import { EditRoleDialog } from './edit-role-dialog'
import { DeleteRoleDialog } from './delete-role-dialog'
import { RoleAssignmentDialog } from './role-assignment-dialog'
import type { RoleWithCount } from './roles-management-wrapper'
import { scopeLabels } from './types'
import { type RoleFormData } from './types'

function UsersHover({ roleId, count }: { roleId: string; count: number }) {
  const trpc = useTRPC()
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useQuery({
    ...trpc.user.list.queryOptions({ page: 1, limit: 1000 }),
    enabled: open,
    staleTime: 60_000,
  })

  const users = (data?.data || []).filter(
    (u) => Array.isArray(u.roles) && u.roles.some((r) => r.id === roleId)
  )

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <div className="flex cursor-default items-center space-x-1">
          <Users className="text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm">{count}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs p-2">
        {isLoading ? (
          <span className="text-muted-foreground text-xs">Yükleniyor...</span>
        ) : users.length === 0 ? (
          <span className="text-muted-foreground text-xs">Kullanıcı yok</span>
        ) : (
          <div className="max-h-56 space-y-1 overflow-auto text-xs">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2">
                <span>
                  {`${u.name ?? ''} ${u.lastName ?? ''}`.trim() || u.username}
                </span>
                <span className="text-muted-foreground">{u.email}</span>
              </div>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function PermissionsHover({ permissions }: { permissions: string[] }) {
  const uniquePermissions = Array.from(new Set(permissions || []))
  const preview = uniquePermissions.slice(0, 3)
  const remaining = uniquePermissions.length - preview.length

  return (
    <div className="flex flex-wrap gap-0.5 sm:gap-1">
      {preview.map((permission, i) => (
        <Badge
          key={`${permission}-${i}`}
          variant="outline"
          className="text-[10px] sm:text-xs"
        >
          {permission}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[10px] sm:text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}

export function RoleWithCountTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleWithCount | null>(null)

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState<'name' | 'scope' | 'createdAt'>({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
  })

  const {
    data: rolesData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.role.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () =>
      rolesData?.data
        ?.filter(
          (role) =>
            role.id !== undefined &&
            role.name !== undefined &&
            role.createdAt !== undefined &&
            role.updatedAt !== undefined
        )
        .map(
          (role): RoleWithCount => ({
            id: role.id!,
            name: role.name!,
            scope: role.scope || 'USER',
            permissions: role.permissions || [],
            userCount: role.userCount || 0,
            createdAt: role.createdAt!,
            updatedAt: role.updatedAt!,
            deletedAt: role.deletedAt ?? null,
          })
        ) ?? [],
    [rolesData?.data]
  )

  const paginationMeta = rolesData?.pagination
    ? {
        page: rolesData.pagination.page,
        limit: rolesData.pagination.limit,
        total: rolesData.pagination.total,
        totalPages: rolesData.pagination.totalPages,
      }
    : undefined

  const createRoleMutation = useMutation({
    ...trpc.role.create.mutationOptions({
      onSuccess: () => {
        toast.success('Rol başarıyla oluşturuldu')
        setShowCreateDialog(false)
        void queryClient.invalidateQueries({
          queryKey: trpc.role.list.queryKey(),
        })
        invalidateAuthRbacQueries(queryClient, trpc)
      },
      onError: (mutationError) => {
        toast.error(
          mutationError.message || 'Rol oluşturulurken bir hata oluştu'
        )
      },
    }),
  })

  const updateRoleMutation = useMutation({
    ...trpc.role.update.mutationOptions({
      onSuccess: () => {
        toast.success('Rol başarıyla güncellendi')
        setShowEditDialog(false)
        void queryClient.invalidateQueries({
          queryKey: trpc.role.list.queryKey(),
        })
        if (selectedRole?.id) {
          void queryClient.invalidateQueries({
            queryKey: trpc.role.getById.queryKey({ id: selectedRole.id }),
          })
        }
        invalidateAuthRbacQueries(queryClient, trpc)
      },
      onError: (mutationError) => {
        toast.error(
          mutationError.message || 'Rol güncellenirken bir hata oluştu'
        )
      },
    }),
  })

  const deleteRoleMutation = useMutation({
    ...trpc.role.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Rol başarıyla silindi')
        setShowDeleteDialog(false)
        void queryClient.invalidateQueries({
          queryKey: trpc.role.list.queryKey(),
        })
        if (selectedRole?.id) {
          void queryClient.invalidateQueries({
            queryKey: trpc.role.getById.queryKey({ id: selectedRole.id }),
          })
        }
        invalidateAuthRbacQueries(queryClient, trpc)
      },
      onError: (mutationError) => {
        toast.error(mutationError.message || 'Rol silinirken bir hata oluştu')
      },
    }),
  })

  const columns: ColumnDef<RoleWithCount>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Rol Adı',
        meta: { columnLabel: 'Rol adı' },
        cell: ({ row }) => {
          const role = row.original
          return (
            <div>
              <div className="text-xs font-medium sm:text-sm">{role.name}</div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">
                {role.scope
                  ? scopeLabels[role.scope as keyof typeof scopeLabels] ||
                    role.scope
                  : 'Kapsam belirtilmemiş'}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'permissions',
        header: 'İzinler',
        enableSorting: false,
        meta: { columnLabel: 'İzinler', disableColumnFilter: true },
        cell: ({ row }) => (
          <PermissionsHover
            permissions={row.getValue('permissions') as string[]}
          />
        ),
      },
      {
        accessorKey: 'hasGlobalAccess',
        header: 'Erişim',
        enableSorting: false,
        meta: { columnLabel: 'Erişim', disableColumnFilter: true },
        cell: ({ row }) => {
          const hasGlobalAccess = row.getValue('hasGlobalAccess') as boolean
          return (
            <Badge
              variant={hasGlobalAccess ? 'default' : 'secondary'}
              className="text-[10px] sm:text-xs"
            >
              {hasGlobalAccess ? 'Global' : 'Kısıtlı'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'userCount',
        header: 'Kullanıcılar',
        enableSorting: false,
        meta: { columnLabel: 'Kullanıcılar', disableColumnFilter: true },
        cell: ({ row }) => (
          <UsersHover
            roleId={row.original.id ?? ''}
            count={row.getValue('userCount') as number}
          />
        ),
      },
      createIconActionColumn<RoleWithCount>((row) => [
        {
          icon: Eye,
          label: 'Görüntüle',
          onClick: () => {
            setSelectedRole(row.original)
            setShowEditDialog(true)
          },
        },
        {
          icon: Pencil,
          label: 'Düzenle',
          onClick: () => {
            setSelectedRole(row.original)
            setShowEditDialog(true)
          },
        },
        {
          icon: Users,
          label: 'Kullanıcı ata',
          onClick: () => {
            setSelectedRole(row.original)
            setShowAssignmentDialog(true)
          },
        },
        {
          icon: Trash2,
          label: 'Sil',
          variant: 'destructive',
          onClick: () => {
            setSelectedRole(row.original)
            setShowDeleteDialog(true)
          },
        },
      ]),
    ],
    []
  )

  if (error) {
    return (
      <div className="py-6 text-center">
        <p className="mb-2 text-red-600">Roller yüklenirken bir hata oluştu</p>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={handleSearchChange}
        searchPlaceholder="Rollerde ara..."
        pagination={paginationMeta}
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        getRowId={(row) => row.id ?? ''}
        autoHideEmptyColumns={false}
        toolbarAdd={
          <Button
            type="button"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni rol
          </Button>
        }
      />

      <CreateRoleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={async (data) => {
          await createRoleMutation.mutateAsync({
            name: data.name,
            scope: data.scope,
            permissions: data.permissions,
          })
        }}
      />

      {selectedRole?.id ? (
        <EditRoleDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          roleId={selectedRole.id}
          initialData={{
            name: selectedRole.name,
            scope: selectedRole.scope as RoleFormData['scope'],
            permissions:
              selectedRole.permissions as RoleFormData['permissions'],
          }}
          onUpdate={async (roleId, data) => {
            await updateRoleMutation.mutateAsync({
              id: roleId,
              name: data.name,
              scope: data.scope,
              permissions: data.permissions,
            })
          }}
        />
      ) : null}

      {selectedRole?.id ? (
        <DeleteRoleDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          roleId={selectedRole.id}
          roleName={selectedRole.name ?? ''}
          userCount={selectedRole.userCount}
          onDelete={async (roleId) => {
            await deleteRoleMutation.mutateAsync({ id: roleId })
          }}
        />
      ) : null}

      {selectedRole?.id ? (
        <RoleAssignmentDialog
          open={showAssignmentDialog}
          onOpenChange={setShowAssignmentDialog}
          onAssign={async () => {}}
          availableUsers={[]}
          availableRoleGroups={[]}
          existingAssignments={[]}
        />
      ) : null}
    </div>
  )
}
