'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { CreateSolutionGroupDialog } from './create-dialog'
import { DeleteSolutionGroupDialog } from './delete-dialog'
import { DetailSolutionGroupDialog } from './detail-dialog'
import { UpdateSolutionGroupDialog } from './update-dialog'

export type AdminSolutionGroupRow = {
  id: string
  name: string
  description: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const REORDER_FILTER_TOAST =
  'Sıralamayı değiştirmek için arama ve sütun filtrelerini temizleyin.'

export function SolutionGroupDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: canCreate } = usePermission(
    SCOPES.SOLUTION_GROUP,
    PERMISSIONS.CREATE
  )
  const { data: canRead } = usePermission(
    SCOPES.SOLUTION_GROUP,
    PERMISSIONS.READ
  )
  const { data: canUpdate } = usePermission(
    SCOPES.SOLUTION_GROUP,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.SOLUTION_GROUP,
    PERMISSIONS.DELETE
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<AdminSolutionGroupRow | null>(null)
  const [editRow, setEditRow] = useState<AdminSolutionGroupRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminSolutionGroupRow | null>(null)

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
    queryKey: trpc.solutionGroup.listReorderScope.queryKey(),
    queryFn: () =>
      queryClient.fetchQuery(
        trpc.solutionGroup.listReorderScope.queryOptions()
      ),
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.solutionGroup.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as AdminSolutionGroupRow[],
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
    trpc.solutionGroup.reorder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.solutionGroup.list.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.solutionGroup.listReorderScope.queryKey(),
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

  const columns: ColumnDef<AdminSolutionGroupRow>[] = useMemo(
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
        accessorKey: 'name',
        header: 'Ad',
        meta: {
          columnLabel: 'Ad',
          cellClassName: 'font-medium',
        },
      },
      {
        accessorKey: 'description',
        header: 'Açıklama',
        enableSorting: false,
        meta: {
          columnLabel: 'Açıklama',
          cellClassName: 'text-muted-foreground max-w-md truncate',
        },
      },
      createIconActionColumn<AdminSolutionGroupRow>((row) => {
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
    (table: ReactTable<AdminSolutionGroupRow>) =>
      table
        .getRowModel()
        .rows.map((row) => (
          <SortableSolutionGroupTableRow
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
          searchPlaceholder="Ad veya açıklama ara..."
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
                Yeni grup
              </Button>
            ) : null
          }
        />
      )}

      <CreateSolutionGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {detailRow ? (
        <DetailSolutionGroupDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {editRow ? (
        <UpdateSolutionGroupDialog
          key={editRow.id}
          row={editRow}
          open={true}
          onOpenChange={(open) => !open && setEditRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteSolutionGroupDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
    </div>
  )
}

function SortableSolutionGroupTableRow({
  row,
  displayIndex,
  canReorder,
}: {
  row: Row<AdminSolutionGroupRow>
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
