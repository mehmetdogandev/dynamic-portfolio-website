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
import { CreateJaponFormenDialog } from './create-formen-dialog'
import { DeleteJaponFormenDialog } from './delete-formen-dialog'
import { DetailJaponFormenDialog } from './detail-formen-dialog'
import { UpdateJaponFormenDialog } from './update-formen-dialog'

export type JaponFormenRow = {
  id: string
  name: string
  surname: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

function formatFormenName(row: JaponFormenRow) {
  return row.surname ? `${row.name} ${row.surname}` : row.name
}

export function JaponFormenDataTable() {
  const trpc = useTRPC()

  const { data: canCreate } = usePermission(
    SCOPES.JAPON_OTO_FORMEN,
    PERMISSIONS.CREATE
  )
  const { data: canRead } = usePermission(
    SCOPES.JAPON_OTO_FORMEN,
    PERMISSIONS.READ
  )
  const { data: canUpdate } = usePermission(
    SCOPES.JAPON_OTO_FORMEN,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.JAPON_OTO_FORMEN,
    PERMISSIONS.DELETE
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<JaponFormenRow | null>(null)
  const [editRow, setEditRow] = useState<JaponFormenRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<JaponFormenRow | null>(null)

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
    ...trpc.japonFormen.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as JaponFormenRow[],
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

  const columns: ColumnDef<JaponFormenRow>[] = useMemo(
    () => [
      {
        id: 'fullName',
        header: 'Ad',
        accessorFn: (row) => formatFormenName(row),
        meta: { columnLabel: 'Ad', cellClassName: 'font-medium' },
      },
      {
        accessorKey: 'phone',
        header: 'Telefon',
        cell: ({ row }) => row.original.phone ?? '—',
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
      createIconActionColumn<JaponFormenRow>((row) => {
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
          searchPlaceholder="Ad veya telefon ara..."
          pagination={paginationMeta}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          getRowId={(row) => row.id}
          toolbarAdd={
            canCreate ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni formen
              </Button>
            ) : null
          }
        />
      )}

      <CreateJaponFormenDialog open={createOpen} onOpenChange={setCreateOpen} />
      {detailRow ? (
        <DetailJaponFormenDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {editRow ? (
        <UpdateJaponFormenDialog
          key={editRow.id}
          row={editRow}
          open={true}
          onOpenChange={(open) => !open && setEditRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteJaponFormenDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
    </div>
  )
}
