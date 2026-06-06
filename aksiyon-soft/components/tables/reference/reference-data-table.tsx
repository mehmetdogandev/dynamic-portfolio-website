'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  flexRender,
  type ColumnDef,
  type Row,
  type Table as ReactTable,
} from '@tanstack/react-table'
import { Eye, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { TableCell, TableRow } from '@/components/ui/table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import {
  useReorderScope,
  useReorderScopeDisabled,
} from '@/lib/hooks/use-reorder-scope'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { CreateReferenceDialog } from '@/components/tables/reference/create-reference-dialog'
import { UpdateReferenceDialog } from '@/components/tables/reference/update-reference-dialog'
import { DetailReferenceDialog } from '@/components/tables/reference/detail-reference-dialog'
import { DeleteReferenceDialog } from '@/components/tables/reference/delete-reference-dialog'

export type AdminReferenceRow = {
  id: string
  name: string
  sector: string
  description: string | null
  summary: string | null
  websiteUrl: string | null
  logoId: string | null
  logoAlt: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  logoViewUrl: string | null
}

const REORDER_FILTER_TOAST =
  'Sıralamayı değiştirmek için arama ve sütun filtrelerini temizleyin.'

export function ReferenceDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: canCreate } = usePermission(
    SCOPES.REFERENCE,
    PERMISSIONS.CREATE
  )
  const { data: canRead } = usePermission(SCOPES.REFERENCE, PERMISSIONS.READ)
  const { data: canUpdate } = usePermission(
    SCOPES.REFERENCE,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.REFERENCE,
    PERMISSIONS.DELETE
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminReferenceRow | null>(null)
  const [detailRow, setDetailRow] = useState<AdminReferenceRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminReferenceRow | null>(null)

  const {
    pagination,
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
    hasActiveFilters,
  } = useAdminTableState({
    defaultPageSize: 10,
    defaultSort: { id: 'sortOrder', desc: false },
  })

  const reorderDisabled = useReorderScopeDisabled(hasActiveFilters)

  const { orderedIds: scopeOrderedIds } = useReorderScope({
    enabled: Boolean(canUpdate) && !reorderDisabled,
    queryKey: trpc.reference.listReorderScope.queryKey(),
    queryFn: () =>
      queryClient.fetchQuery(trpc.reference.listReorderScope.queryOptions()),
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.reference.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as AdminReferenceRow[],
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

  const { mutateAsync: reorderAsync } = useMutation(
    trpc.reference.reorder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.reference.list.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.reference.listReorderScope.queryKey(),
        })
      },
    })
  )

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (reorderDisabled) {
        toast.info(REORDER_FILTER_TOAST)
        return
      }
      if (!canUpdate) return

      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = scopeOrderedIds.indexOf(String(active.id))
      const newIndex = scopeOrderedIds.indexOf(String(over.id))
      if (oldIndex < 0 || newIndex < 0) return

      const nextIds = arrayMove([...scopeOrderedIds], oldIndex, newIndex)
      try {
        await reorderAsync({ orderedIds: nextIds })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Sıralama kaydedilemedi'
        )
      }
    },
    [reorderDisabled, canUpdate, scopeOrderedIds, reorderAsync]
  )

  const columns: ColumnDef<AdminReferenceRow>[] = useMemo(
    () => [
      {
        id: 'sort',
        header: 'Sıra',
        enableSorting: false,
        meta: {
          columnLabel: 'Sıra',
          disableColumnFilter: true,
          headerClassName: 'w-12',
          cellClassName: 'w-12',
        },
        cell: () => null,
      },
      {
        id: 'logo',
        header: '',
        enableSorting: false,
        meta: {
          columnLabel: 'Logo',
          disableColumnFilter: true,
          headerClassName: 'w-14',
          cellClassName: 'w-14',
        },
        cell: ({ row }) => (
          <div className="bg-muted relative size-10 overflow-hidden rounded-md">
            {row.original.logoViewUrl ? (
              <Image
                src={row.original.logoViewUrl}
                alt=""
                fill
                unoptimized
                className="object-contain p-0.5"
                sizes="40px"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-xs font-bold">
                ?
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Ad',
        meta: {
          columnLabel: 'Ad',
          cellClassName: 'font-medium',
        },
      },
      {
        accessorKey: 'sector',
        header: 'Sektör',
        meta: { columnLabel: 'Sektör' },
      },
      {
        accessorKey: 'description',
        header: 'Açıklama',
        enableSorting: false,
        meta: {
          columnLabel: 'Açıklama',
          cellClassName:
            'text-muted-foreground max-w-[220px] truncate text-sm align-top',
        },
        cell: ({ row }) => row.original.description ?? '—',
      },
      createIconActionColumn<AdminReferenceRow>((row) => {
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

  const canReorder = Boolean(canUpdate) && !reorderDisabled
  const displayOffset = pagination.pageIndex * pagination.pageSize

  const tableDnd = useMemo(
    () => ({
      items: rows.map((row) => row.id),
      onDragEnd,
      disabled: !canReorder,
    }),
    [rows, onDragEnd, canReorder]
  )

  const renderTableBody = useCallback(
    (table: ReactTable<AdminReferenceRow>) =>
      table
        .getRowModel()
        .rows.map((row) => (
          <SortableReferenceTableRow
            key={row.id}
            row={row}
            displayIndex={displayOffset + row.index + 1}
            canReorder={canReorder}
          />
        )),
    [canReorder, displayOffset]
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
          searchPlaceholder="Ad, sektör veya açıklama ara..."
          pagination={paginationMeta}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          getRowId={(row) => row.id}
          renderTableBody={renderTableBody}
          tableDnd={tableDnd}
          autoHideEmptyColumns={false}
          toolbarAdd={
            canCreate ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni referans
              </Button>
            ) : null
          }
        />
      )}

      <CreateReferenceDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editRow ? (
        <UpdateReferenceDialog
          key={editRow.id}
          row={editRow}
          open={true}
          onOpenChange={(open) => !open && setEditRow(null)}
        />
      ) : null}
      {detailRow ? (
        <DetailReferenceDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteReferenceDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
    </div>
  )
}

function SortableReferenceTableRow({
  row,
  displayIndex,
  canReorder,
}: {
  row: Row<AdminReferenceRow>
  displayIndex: number
  canReorder: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
    disabled: !canReorder,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-muted/60' : undefined}
    >
      {row.getVisibleCells().map((cell) => {
        const meta = cell.column.columnDef.meta as
          | { cellClassName?: string }
          | undefined

        if (cell.column.id === 'sort') {
          return (
            <TableCell key={cell.id} className={meta?.cellClassName}>
              {canReorder ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-grab touch-none active:cursor-grabbing"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              ) : (
                <span className="text-muted-foreground inline-flex w-7 justify-center text-xs tabular-nums">
                  {displayIndex}
                </span>
              )}
            </TableCell>
          )
        }

        return (
          <TableCell key={cell.id} className={meta?.cellClassName}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
