'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
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
import { adminListFetchAllInput } from '@/lib/trpc/admin-list'
import { adminHref } from '@/lib/admin-path'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { TableCell, TableRow } from '@/components/ui/table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { useReorderScope } from '@/lib/hooks/use-reorder-scope'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { DeleteProjectDialog } from './delete-project-dialog'
import { DetailProjectDialog } from './detail-project-dialog'
import type { AdminProjectGroupRow } from './project-group/data-table'
import type { AdminProjectRow } from './types'

const REORDER_FILTER_TOAST =
  'Sıralamayı değiştirmek için arama ve diğer sütun filtrelerini temizleyin.'
const REORDER_GROUP_TOAST =
  'Sıralamayı değiştirmek için tek bir çözüm grubuna filtreleyin.'

const COLUMN_FILTER_KEY_MAP = { projectGroup: 'projectGroupId' } as const

export function ProjectDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [detailRow, setDetailRow] = useState<AdminProjectRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminProjectRow | null>(null)

  const { data: canCreate } = usePermission(SCOPES.PROJECT, PERMISSIONS.CREATE)
  const { data: canRead } = usePermission(SCOPES.PROJECT, PERMISSIONS.READ)
  const { data: canUpdate } = usePermission(SCOPES.PROJECT, PERMISSIONS.UPDATE)
  const { data: canDelete } = usePermission(SCOPES.PROJECT, PERMISSIONS.DELETE)

  const { data: groupData } = useQuery(
    trpc.projectGroup.list.queryOptions(adminListFetchAllInput('sortOrder'))
  )
  const groups = useMemo(
    () => (groupData?.data ?? []) as AdminProjectGroupRow[],
    [groupData]
  )
  const groupFilterOptions = useMemo(
    () => [
      { value: '', label: 'Tüm gruplar' },
      ...groups.map((group) => ({ value: group.id, label: group.name })),
    ],
    [groups]
  )

  const {
    pagination,
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    debouncedSearch,
    columnFiltersRecord,
    listInput,
  } = useAdminTableState({
    defaultPageSize: 10,
    defaultSort: { id: 'sortOrder', desc: false },
    columnFilterKeyMap: COLUMN_FILTER_KEY_MAP,
  })

  const groupFilterId = columnFiltersRecord.projectGroupId
  const hasNonGroupListFilters =
    Boolean(debouncedSearch) ||
    Object.entries(columnFiltersRecord).some(
      ([key]) => key !== 'projectGroupId'
    )
  const canReorder =
    Boolean(canUpdate) && Boolean(groupFilterId) && !hasNonGroupListFilters

  const { orderedIds: scopeOrderedIds } = useReorderScope({
    enabled: canReorder,
    queryKey: trpc.project.listReorderScope.queryKey({
      projectGroupId: groupFilterId ?? '',
    }),
    queryFn: () =>
      queryClient.fetchQuery(
        trpc.project.listReorderScope.queryOptions({
          projectGroupId: groupFilterId!,
        })
      ),
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.project.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (data?.data ?? []) as AdminProjectRow[],
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

  const invalidateSolutionQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.project.list.queryKey(),
    })
    if (groupFilterId) {
      await queryClient.invalidateQueries({
        queryKey: trpc.project.listReorderScope.queryKey({
          projectGroupId: groupFilterId,
        }),
      })
    }
  }, [queryClient, trpc, groupFilterId])

  const { mutateAsync: reorderAsync } = useMutation(
    trpc.project.reorder.mutationOptions({
      onSuccess: invalidateSolutionQueries,
    })
  )

  const { mutateAsync: moveToGroupAsync } = useMutation(
    trpc.project.moveToGroup.mutationOptions({
      onSuccess: invalidateSolutionQueries,
    })
  )

  const handleMoveToGroup = useCallback(
    async (row: AdminProjectRow, projectGroupId: string) => {
      if (!projectGroupId || projectGroupId === row.groupId) return
      try {
        await moveToGroupAsync({ id: row.id, projectGroupId })
        toast.success('Proje grubu güncellendi')
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Proje grubu güncellenemedi'
        )
      }
    },
    [moveToGroupAsync]
  )

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!groupFilterId) {
        toast.info(REORDER_GROUP_TOAST)
        return
      }
      if (hasNonGroupListFilters) {
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
        await reorderAsync({
          groupId: groupFilterId,
          orderedIds: nextIds,
        })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Sıralama kaydedilemedi'
        )
      }
    },
    [
      groupFilterId,
      hasNonGroupListFilters,
      canUpdate,
      scopeOrderedIds,
      reorderAsync,
    ]
  )

  const columns: ColumnDef<AdminProjectRow>[] = useMemo(
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
        id: 'thumbnail',
        header: '',
        enableSorting: false,
        meta: {
          columnLabel: 'Kapak',
          disableColumnFilter: true,
          headerClassName: 'w-16',
          cellClassName: 'w-16',
        },
        cell: ({ row }) => (
          <div className="bg-muted relative size-12 overflow-hidden rounded-md">
            {row.original.fileViewUrl ? (
              <Image
                src={row.original.fileViewUrl}
                alt={row.original.title}
                fill
                unoptimized
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center text-[10px]">
                —
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Başlık',
        meta: {
          columnLabel: 'Başlık',
          cellClassName: 'max-w-[240px] truncate font-medium',
        },
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        meta: {
          columnLabel: 'Slug',
          cellClassName: 'text-muted-foreground max-w-[180px] truncate text-sm',
        },
        cell: ({ row }) => `/${row.original.slug}`,
      },
      {
        id: 'projectGroup',
        accessorKey: 'groupName',
        header: 'Grup',
        enableSorting: false,
        meta: {
          columnLabel: 'Grup',
          filterKey: 'projectGroupId',
          filterPlaceholder: 'Grup seç...',
          filterSelectOptions: groupFilterOptions,
          cellClassName: 'min-w-[160px]',
        },
        cell: ({ row }) =>
          canUpdate && row.original.groupId ? (
            <Select
              value={row.original.groupId}
              onValueChange={(value) => handleMoveToGroup(row.original, value)}
            >
              <SelectTrigger className="h-8 w-full max-w-[200px] text-xs">
                <SelectValue placeholder="Grup seç" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm">{row.original.groupName ?? '—'}</span>
          ),
      },
      {
        accessorKey: 'isPublished',
        header: 'Durum',
        enableSorting: false,
        meta: {
          columnLabel: 'Durum',
          filterPlaceholder: 'Yayında veya taslak...',
        },
        cell: ({ row }) => (
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs',
              row.original.isPublished
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {row.original.isPublished ? 'YAYINDA' : 'TASLAK'}
          </span>
        ),
      },
      createIconActionColumn<AdminProjectRow>((row) => {
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
            onClick: () =>
              router.push(adminHref(`/project/${row.original.id}`)),
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
    [
      canRead,
      canUpdate,
      canDelete,
      groups,
      groupFilterOptions,
      handleMoveToGroup,
      router,
    ]
  )

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
    (table: ReactTable<AdminProjectRow>) =>
      table
        .getRowModel()
        .rows.map((row) => (
          <SortableSolutionTableRow
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
          {error?.message ?? 'Çözüm kayıtları yüklenemedi'}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          globalFilter={search}
          onGlobalFilterChange={handleSearchChange}
          searchPlaceholder="Başlık veya slug ara..."
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
          tableMinWidth="min-w-[1000px]"
          toolbarAdd={
            canCreate ? (
              <Button
                type="button"
                size="sm"
                onClick={() => router.push(adminHref('/project/new'))}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni çözüm
              </Button>
            ) : null
          }
        />
      )}

      {detailRow ? (
        <DetailProjectDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteProjectDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
    </div>
  )
}

function SortableSolutionTableRow({
  row,
  displayIndex,
  canReorder,
}: {
  row: Row<AdminProjectRow>
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
