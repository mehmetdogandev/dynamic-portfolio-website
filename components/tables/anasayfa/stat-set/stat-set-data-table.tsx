'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Plus, Rocket, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { CreateStatSetDialog } from './create-stat-set-dialog'
import { UpdateStatSetDialog } from './update-stat-set-dialog'
import { DetailStatSetDialog } from './detail-stat-set-dialog'
import { DeleteStatSetDialog } from './delete-stat-set-dialog'
import type { AdminHomeStatSetRow } from './types'

function formatStatsSummary(row: AdminHomeStatSetRow) {
  return [
    `${row.stat1Value} ${row.stat1Label}`,
    `${row.stat2Value} ${row.stat2Label}`,
    `${row.stat3Value} ${row.stat3Label}`,
    `${row.stat4Value} ${row.stat4Label}`,
  ].join(' · ')
}

export function StatSetDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: canCreate } = usePermission(
    SCOPES.HOME_STAT_SET,
    PERMISSIONS.CREATE
  )
  const { data: canRead } = usePermission(SCOPES.HOME_STAT_SET, PERMISSIONS.READ)
  const { data: canUpdate } = usePermission(
    SCOPES.HOME_STAT_SET,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.HOME_STAT_SET,
    PERMISSIONS.DELETE
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminHomeStatSetRow | null>(null)
  const [detailRow, setDetailRow] = useState<AdminHomeStatSetRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminHomeStatSetRow | null>(null)

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
    defaultSort: { id: 'createdAt', desc: true },
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.homeStatSet.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as AdminHomeStatSetRow[],
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

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.homeStatSet.list.queryKey(),
    })
  }

  const { mutateAsync: publishAsync, isPending: isPublishing } = useMutation(
    trpc.homeStatSet.publish.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Set yayınlandı. Diğer setler taslağa alındı.')
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const { mutateAsync: unpublishAsync, isPending: isUnpublishing } = useMutation(
    trpc.homeStatSet.unpublish.mutationOptions({
      onSuccess: async () => {
        await invalidate()
        toast.success('Set yayından kaldırıldı')
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const columns: ColumnDef<AdminHomeStatSetRow>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Ad',
        meta: { columnLabel: 'Ad', cellClassName: 'font-medium' },
      },
      {
        accessorKey: 'status',
        header: 'Durum',
        meta: { columnLabel: 'Durum' },
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'PUBLISHED' ? 'default' : 'secondary'
            }
          >
            {row.original.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
          </Badge>
        ),
      },
      {
        id: 'summary',
        header: 'Kutular',
        enableSorting: false,
        meta: { columnLabel: 'Kutular', disableColumnFilter: true },
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {formatStatsSummary(row.original)}
          </span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Güncelleme',
        meta: { columnLabel: 'Güncelleme' },
        cell: ({ row }) =>
          row.original.updatedAt.toLocaleString('tr-TR', {
            dateStyle: 'short',
            timeStyle: 'short',
          }),
      },
      createIconActionColumn<AdminHomeStatSetRow>((row) => {
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
          if (row.original.status !== 'PUBLISHED') {
            actions.push({
              icon: Rocket,
              label: 'Yayınla',
              onClick: () => void publishAsync({ id: row.original.id }),
            })
          } else {
            actions.push({
              icon: Undo2,
              label: 'Yayından kaldır',
              onClick: () => void unpublishAsync({ id: row.original.id }),
            })
          }
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
    [canRead, canUpdate, canDelete, publishAsync, unpublishAsync]
  )

  return (
    <div className="space-y-4">
      {isError ? (
        <p className="text-destructive text-sm">
          {error?.message ?? 'Kayıtlar yüklenemedi'}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading || isPublishing || isUnpublishing}
          globalFilter={search}
          onGlobalFilterChange={handleSearchChange}
          pagination={paginationMeta}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          searchPlaceholder="Set adı veya etiket ara…"
          autoHideEmptyColumns={false}
          toolbarAdd={
            canCreate ? (
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni set
              </Button>
            ) : null
          }
        />
      )}

      <CreateStatSetDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editRow ? (
        <UpdateStatSetDialog
          row={editRow}
          open={Boolean(editRow)}
          onOpenChange={(open) => {
            if (!open) setEditRow(null)
          }}
        />
      ) : null}
      {detailRow ? (
        <DetailStatSetDialog
          row={detailRow}
          open={Boolean(detailRow)}
          onOpenChange={(open) => {
            if (!open) setDetailRow(null)
          }}
        />
      ) : null}
      {deleteRow ? (
        <DeleteStatSetDialog
          row={deleteRow}
          open={Boolean(deleteRow)}
          onOpenChange={(open) => {
            if (!open) setDeleteRow(null)
          }}
        />
      ) : null}
    </div>
  )
}
