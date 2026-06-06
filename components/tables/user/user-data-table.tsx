'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Edit, Eye, Trash2, Undo2, UserPlus } from 'lucide-react'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { useTRPC } from '@/lib/trpc/client'
import { CreateUserDialog } from '@/components/tables/user/create-user-dialog'
import { EditUserDialog } from '@/components/tables/user/edit-user-dialog'
import { DeleteUserDialog } from '@/components/tables/user/delete-user-dialog'
import { UserDetailsDialog } from '@/components/tables/user/user-details-dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { scopesEnum } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { RestoreUserDialog } from '@/components/tables/user/restore-user-dialog'
import { capitalizeWords } from '@/lib/utils'

type ScopeValue = (typeof scopesEnum.enumValues)[number]

export type UserWithRoles = {
  id?: string
  name: string
  lastName: string
  image?: string | null
  email: string
  username: string | null
  createdAt: Date
  updatedAt: Date
  roles: Array<{
    id: string | null
    name: string | null
    scope: ScopeValue | null
  }>
}

export type FilteredUserWithRoles = UserWithRoles & {
  id: string
}

export function UserDataTable() {
  const trpc = useTRPC()
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>(
    'active'
  )
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [detailUser, setDetailUser] = useState<FilteredUserWithRoles | null>(
    null
  )
  const [editUser, setEditUser] = useState<FilteredUserWithRoles | null>(null)
  const [deleteUser, setDeleteUser] = useState<FilteredUserWithRoles | null>(
    null
  )
  const [restoreUserTarget, setRestoreUserTarget] = useState<null | {
    id: string
    name: string
    lastName: string
    email: string
  }>(null)

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState<'name' | 'email' | 'username' | 'createdAt'>({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
  })

  useEffect(() => {
    handlePaginationChange((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }
    )
  }, [activeFilter, handlePaginationChange])

  const queryInput = useMemo(
    () => ({
      ...listInput,
      includeDeleted: activeFilter === 'inactive' ? true : undefined,
    }),
    [listInput, activeFilter]
  )

  const { data: userData, isLoading } = useQuery({
    ...trpc.user.list.queryOptions(queryInput),
  })

  const { data: canCreate } = usePermission('USER', 'CREATE')
  const { data: canUpdate } = usePermission('USER', 'UPDATE')
  const { data: canDelete } = usePermission('USER', 'DELETE')
  const { data: canRead } = usePermission('USER', 'READ')

  const rows = useMemo(
    () =>
      (userData?.data?.filter((user) =>
        Boolean(user.id && user.name)
      ) as FilteredUserWithRoles[]) ?? [],
    [userData?.data]
  )

  const paginationMeta = userData?.pagination
    ? {
        page: userData.pagination.page,
        limit: userData.pagination.limit,
        total: userData.pagination.total,
        totalPages: userData.pagination.totalPages,
      }
    : undefined

  const columns: ColumnDef<FilteredUserWithRoles>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Kullanıcı Adı',
        meta: { columnLabel: 'Ad' },
        cell: ({ row }) => {
          const name = capitalizeWords(row.original.name)
          const lastName = capitalizeWords(row.original.lastName)
          const username = row.original.username
          const fullName = `${name} ${lastName}`.trim()
          const userImage = row.original.image

          const initials = fullName
            ? fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
            : username
              ? username.slice(0, 2).toUpperCase()
              : 'U'

          return (
            <div className="flex items-center gap-2">
              <Avatar className="hidden h-8 w-8 sm:inline-flex">
                {userImage && (
                  <AvatarImage
                    src={`/api/files/${userImage}/view`}
                    alt={fullName || username || 'User'}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="font-medium">{fullName}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'email',
        header: 'E-posta',
        meta: { columnLabel: 'E-posta' },
        cell: ({ getValue }) => (
          <div className="text-muted-foreground">{getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Kullanıcı adı',
        meta: { columnLabel: 'Kullanıcı adı' },
      },
      {
        accessorKey: 'createdAt',
        header: 'Kayıt Tarihi',
        meta: { columnLabel: 'Kayıt tarihi' },
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string | number | Date)
          return (
            <span className="text-muted-foreground">
              {date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )
        },
      },
      {
        id: 'roles',
        header: 'Roller',
        enableSorting: false,
        meta: { columnLabel: 'Roller', disableColumnFilter: true },
        cell: ({ row }) => {
          const n = row.original.roles?.length ?? 0
          return n > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {n} rol
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Rol yok</span>
          )
        },
      },
      createIconActionColumn<FilteredUserWithRoles>((row) => {
        if (activeFilter === 'inactive') {
          return canCreate
            ? [
                {
                  icon: Undo2,
                  label: 'Geri al',
                  onClick: () =>
                    setRestoreUserTarget({
                      id: row.original.id,
                      name: row.original.name,
                      lastName: row.original.lastName,
                      email: row.original.email,
                    }),
                },
              ]
            : []
        }

        const actions = []
        if (canRead) {
          actions.push({
            icon: Eye,
            label: 'Kullanıcı detayları',
            onClick: () => setDetailUser(row.original),
          })
        }
        if (canUpdate) {
          actions.push({
            icon: Edit,
            label: 'Kullanıcıyı düzenle',
            onClick: () => setEditUser(row.original),
          })
        }
        if (canDelete) {
          actions.push({
            icon: Trash2,
            label: 'Kullanıcıyı sil',
            variant: 'destructive' as const,
            onClick: () => setDeleteUser(row.original),
          })
        }
        return actions
      }),
    ],
    [activeFilter, canCreate, canRead, canUpdate, canDelete]
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Kullanıcı ara..."
        pagination={paginationMeta}
        onPaginationChange={handlePaginationChange}
        globalFilter={search}
        onGlobalFilterChange={handleSearchChange}
        isLoading={isLoading}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        getRowId={(row) => row.id}
        autoHideEmptyColumns={false}
        toolbarAdd={
          canCreate ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowCreateUser(true)}
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              Yeni kullanıcı
            </Button>
          ) : null
        }
        toolbarFilters={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {activeFilter === 'active' ? 'Aktif' : 'Pasif'}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent sideOffset={4}>
              <DropdownMenuItem onSelect={() => setActiveFilter('active')}>
                Aktif
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setActiveFilter('inactive')}>
                Pasif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
      />

      {detailUser ? (
        <UserDetailsDialog
          open={true}
          onOpenChange={(open) => !open && setDetailUser(null)}
          user={detailUser}
        />
      ) : null}

      {editUser ? (
        <EditUserDialog
          key={editUser.id}
          open={true}
          onOpenChange={(open) => !open && setEditUser(null)}
          user={{
            ...editUser,
            roles: editUser.roles.map((role) => ({
              ...role,
              scope: role.scope as string | null,
            })),
          }}
        />
      ) : null}

      {deleteUser ? (
        <DeleteUserDialog
          open={true}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          user={{
            id: deleteUser.id,
            name: deleteUser.name,
            lastName: deleteUser.lastName,
            email: deleteUser.email,
            roles: deleteUser.roles
              .filter((role) => role.id !== null && role.name !== null)
              .map((role) => ({
                id: role.id!,
                name: role.name!,
              })),
          }}
        />
      ) : null}

      <RestoreUserDialog
        open={!!restoreUserTarget}
        onOpenChange={(open) => {
          if (!open) setRestoreUserTarget(null)
        }}
        user={restoreUserTarget}
      />
    </>
  )
}
