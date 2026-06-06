'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { CreateJaponServiceDialog } from './create-service-dialog'
import { DeleteJaponServiceDialog } from './delete-service-dialog'
import { DetailJaponServiceDialog } from './detail-service-dialog'
import { UpdateJaponServiceDialog } from './update-service-dialog'

export type JaponServiceRow = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function JaponServiceDataTable() {
  const trpc = useTRPC()

  const { data: canCreate } = usePermission(
    SCOPES.JAPON_OTO_SERVICE,
    PERMISSIONS.CREATE
  )
  const { data: canRead } = usePermission(
    SCOPES.JAPON_OTO_SERVICE,
    PERMISSIONS.READ
  )
  const { data: canUpdate } = usePermission(
    SCOPES.JAPON_OTO_SERVICE,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.JAPON_OTO_SERVICE,
    PERMISSIONS.DELETE
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<JaponServiceRow | null>(null)
  const [editRow, setEditRow] = useState<JaponServiceRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<JaponServiceRow | null>(null)

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.japonService.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as JaponServiceRow[],
    [data?.data]
  )
  const paginationMeta = data?.pagination
    ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }
    : undefined

  const columns: ColumnDef<JaponServiceRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Ad',
        meta: { columnLabel: 'Ad', cellClassName: 'font-medium' },
      },
      {
        accessorKey: 'description',
        header: 'Açıklama',
        enableSorting: false,
        cell: ({ row }) => row.original.description ?? '—',
      },
      {
        accessorKey: 'isActive',
        header: 'Durum',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
            {row.original.isActive ? 'Aktif' : 'Pasif'}
          </Badge>
        ),
      },
      createIconActionColumn<JaponServiceRow>((row) => {
        const actions = []
        if (canRead) {
          actions.push({
            icon: Eye,
            label: 'Detay',
            onClick: () => setDetailRow(row.original),
          })
        }
        if (canUpdate) {
          actions.push({
            icon: Pencil,
            label: 'Düzenle',
            onClick: () => setEditRow(row.original),
          })
        }
        if (canDelete) {
          actions.push({
            icon: Trash2,
            label: 'Sil',
            variant: 'destructive' as const,
            onClick: () => setDeleteRow(row.original),
          })
        }
        return actions
      }),
    ],
    [canRead, canUpdate, canDelete]
  )

  return (
    <div className="space-y-4">
      {isError ? (
        <p className="text-destructive text-sm">
          {error?.message ?? 'Yüklenemedi'}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          globalFilter={search}
          onGlobalFilterChange={handleSearchChange}
          searchPlaceholder="Ad veya açıklama ara..."
          pagination={paginationMeta}
          onPaginationChange={handlePaginationChange}
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
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni servis
              </Button>
            ) : null
          }
        />
      )}

      <CreateJaponServiceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {detailRow ? (
        <DetailJaponServiceDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {editRow ? (
        <UpdateJaponServiceDialog
          key={editRow.id}
          row={editRow}
          open={true}
          onOpenChange={(open) => !open && setEditRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteJaponServiceDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
    </div>
  )
}
