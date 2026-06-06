'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
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
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { useTRPC } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { HERO_AUTOPLAY_DEFAULT_MS } from '@/lib/website/slider-autoplay'
import { sliderTypeLabel } from '@/lib/website/slider-hero-type'
import { Button } from '@/components/ui/button'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { TableCell, TableRow } from '@/components/ui/table'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import {
  useReorderScope,
  useReorderScopeDisabled,
} from '@/lib/hooks/use-reorder-scope'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CreateSliderGroupDialog } from './create-slider-group-dialog'
import { DeleteSliderGroupDialog } from './delete-slider-group-dialog'
import { DeleteSlideDialog } from './delete-slide-dialog'
import { DetailSliderGroupDialog } from './detail-slider-group-dialog'
import { SlideFormDialog } from './slide-form-dialog'
import { UpdateSliderGroupDialog } from './update-slider-group-dialog'
import type { AdminSliderGroupRow, AdminSliderSlideRow } from './types'

const CARD_W = 'w-[min(72vw,200px)]'
const REORDER_FILTER_TOAST =
  'Sıralamayı değiştirmek için arama ve sütun filtrelerini temizleyin.'

export function SliderGroupDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const slideSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 12 } })
  )

  const { data: canCreate } = usePermission(SCOPES.SLIDER, PERMISSIONS.CREATE)
  const { data: canRead } = usePermission(SCOPES.SLIDER, PERMISSIONS.READ)
  const { data: canUpdate } = usePermission(SCOPES.SLIDER, PERMISSIONS.UPDATE)
  const { data: canDelete } = usePermission(SCOPES.SLIDER, PERMISSIONS.DELETE)

  const [createOpen, setCreateOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<AdminSliderGroupRow | null>(null)
  const [editRow, setEditRow] = useState<AdminSliderGroupRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminSliderGroupRow | null>(null)
  const [slideForm, setSlideForm] = useState<{
    open: boolean
    groupId: string
    mode: 'create' | 'edit'
    slide: AdminSliderSlideRow | null
  }>({ open: false, groupId: '', mode: 'create', slide: null })
  const [deleteSlide, setDeleteSlide] = useState<AdminSliderSlideRow | null>(
    null
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
    listInput,
    hasActiveFilters,
  } = useAdminTableState({
    defaultPageSize: 10,
    defaultSort: { id: 'sortOrder', desc: false },
  })

  const reorderDisabled = useReorderScopeDisabled(hasActiveFilters)

  const { orderedIds: scopeOrderedIds } = useReorderScope({
    enabled: Boolean(canUpdate) && !reorderDisabled,
    queryKey: trpc.slider.listReorderScope.queryKey(),
    queryFn: () =>
      queryClient.fetchQuery(trpc.slider.listReorderScope.queryOptions()),
  })

  const { data, isLoading, isError, error } = useQuery({
    ...trpc.slider.listGroups.queryOptions(listInput),
  })

  const [groups, setGroups] = useState<AdminSliderGroupRow[]>([])

  useEffect(() => {
    setGroups((data?.data ?? []) as AdminSliderGroupRow[])
  }, [data])

  const paginationMeta = data?.pagination
    ? {
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }
    : undefined

  const { mutateAsync: reorderGroupsAsync } = useMutation(
    trpc.slider.reorderGroups.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.slider.listGroups.queryKey(),
        })
        await queryClient.invalidateQueries({
          queryKey: trpc.slider.listReorderScope.queryKey(),
        })
      },
    })
  )

  const { mutateAsync: reorderSlidesAsync } = useMutation(
    trpc.slider.reorderSlides.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.slider.listGroups.queryKey(),
        })
      },
    })
  )

  const onGroupDragEnd = useCallback(
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

      try {
        await reorderGroupsAsync({
          orderedIds: arrayMove([...scopeOrderedIds], oldIndex, newIndex),
        })
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Grup sırası kaydedilemedi'
        )
      }
    },
    [reorderDisabled, canUpdate, scopeOrderedIds, reorderGroupsAsync]
  )

  const handleSlideDragEnd = useCallback(
    (groupId: string) => async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const prev = groups
      const group = prev.find((item) => item.id === groupId)
      if (!group) return

      const oldIndex = group.slides.findIndex((slide) => slide.id === active.id)
      const newIndex = group.slides.findIndex((slide) => slide.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const newSlides = arrayMove(group.slides, oldIndex, newIndex)
      const orderedIds = newSlides.map((slide) => slide.id)
      const next = prev.map((item) =>
        item.id === groupId ? { ...item, slides: newSlides } : item
      )
      setGroups(next)

      try {
        await reorderSlidesAsync({ groupId, orderedIds })
      } catch (err) {
        setGroups(prev)
        toast.error(
          err instanceof Error ? err.message : 'Slayt sırası kaydedilemedi'
        )
      }
    },
    [groups, reorderSlidesAsync]
  )

  const columns: ColumnDef<AdminSliderGroupRow>[] = useMemo(
    () => [
      {
        id: 'sort',
        header: 'Sıra',
        enableSorting: false,
        meta: {
          columnLabel: 'Sıra',
          disableColumnFilter: true,
          headerClassName: 'w-10',
          cellClassName: 'w-10 align-top',
        },
        cell: () => null,
      },
      {
        accessorKey: 'name',
        header: 'Grup',
        meta: {
          columnLabel: 'Grup',
          cellClassName: 'relative min-w-[140px] align-top whitespace-normal',
        },
        cell: ({ row }) => (
          <div className="space-y-1 pr-1 pt-1 pb-10">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-muted-foreground text-xs">
              {sliderTypeLabel(row.original.type)} ·{' '}
              {row.original.status === 'DRAFT' ? 'Taslak' : 'Yayında'} ·{' '}
              {row.original.autoplayInterval ?? HERO_AUTOPLAY_DEFAULT_MS} ms
            </p>
          </div>
        ),
      },
      {
        id: 'slides',
        header: 'Slider elemanları',
        enableSorting: false,
        meta: {
          columnLabel: 'Slider elemanları',
          disableColumnFilter: true,
          headerClassName: 'min-w-[280px]',
          cellClassName: 'min-w-0 align-top',
        },
        cell: () => null,
      },
      createIconActionColumn<AdminSliderGroupRow>((row) => {
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
            label: 'Grubu düzenle',
            onClick: () => setEditRow(row.original),
          })
        }
        if (canDelete) {
          actions.push({
            icon: Trash2,
            label: 'Grubu sil',
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
      items: groups.map((group) => group.id),
      onDragEnd: onGroupDragEnd,
      disabled: !canReorder,
    }),
    [groups, onGroupDragEnd, canReorder]
  )

  const renderTableBody = useCallback(
    (table: ReactTable<AdminSliderGroupRow>) =>
      table.getRowModel().rows.map((row) => (
        <SortableSliderGroupTableRow
          key={row.id}
          row={row}
          groups={groups}
          displayIndex={displayOffset + row.index + 1}
          canReorder={canReorder}
          slideSensors={slideSensors}
          onAddSlide={() =>
            setSlideForm({
              open: true,
              groupId: row.original.id,
              mode: 'create',
              slide: null,
            })
          }
          onEditSlide={(slide) =>
            setSlideForm({
              open: true,
              groupId: row.original.id,
              mode: 'edit',
              slide,
            })
          }
          onDeleteSlide={setDeleteSlide}
          onSlideDragEnd={handleSlideDragEnd(row.original.id)}
        />
      )),
    [groups, canReorder, displayOffset, slideSensors, handleSlideDragEnd]
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
          data={groups}
          isLoading={isLoading}
          globalFilter={search}
          onGlobalFilterChange={handleSearchChange}
          searchPlaceholder="Grup adı veya açıklama ara..."
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
          tableMinWidth="min-w-[720px]"
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

      <CreateSliderGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      {detailRow ? (
        <DetailSliderGroupDialog
          row={detailRow}
          open={true}
          onOpenChange={(open) => !open && setDetailRow(null)}
        />
      ) : null}
      {editRow ? (
        <UpdateSliderGroupDialog
          row={editRow}
          open={true}
          onOpenChange={(open) => !open && setEditRow(null)}
        />
      ) : null}
      {deleteRow ? (
        <DeleteSliderGroupDialog
          row={deleteRow}
          open={true}
          onOpenChange={(open) => !open && setDeleteRow(null)}
        />
      ) : null}
      <SlideFormDialog
        open={slideForm.open}
        onOpenChange={(open) =>
          setSlideForm((state) => ({
            ...state,
            open,
            slide: open ? state.slide : null,
          }))
        }
        groupId={slideForm.groupId}
        mode={slideForm.mode}
        slide={slideForm.slide}
      />
      {deleteSlide ? (
        <DeleteSlideDialog
          slide={deleteSlide}
          open={true}
          onOpenChange={(open) => !open && setDeleteSlide(null)}
        />
      ) : null}
    </div>
  )
}

function SortableSliderGroupTableRow({
  row,
  groups,
  displayIndex,
  canReorder,
  slideSensors,
  onAddSlide,
  onEditSlide,
  onDeleteSlide,
  onSlideDragEnd,
}: {
  row: Row<AdminSliderGroupRow>
  groups: AdminSliderGroupRow[]
  displayIndex: number
  canReorder: boolean
  slideSensors: ReturnType<typeof useSensors>
  onAddSlide: () => void
  onEditSlide: (slide: AdminSliderSlideRow) => void
  onDeleteSlide: (slide: AdminSliderSlideRow) => void
  onSlideDragEnd: (event: DragEndEvent) => void | Promise<void>
}) {
  const group =
    groups.find((item) => item.id === row.original.id) ?? row.original
  const slideIds = group.slides.map((slide) => slide.id)

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

  const { data: canCreateSlide } = usePermission(
    SCOPES.SLIDER,
    PERMISSIONS.CREATE
  )

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
                  className="mt-1 h-7 w-7 cursor-grab touch-none active:cursor-grabbing"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              ) : (
                <span className="text-muted-foreground mt-1 inline-flex w-7 justify-center text-xs tabular-nums">
                  {displayIndex}
                </span>
              )}
            </TableCell>
          )
        }

        if (cell.column.id === 'slides') {
          return (
            <TableCell key={cell.id} className={meta?.cellClassName}>
              <DndContext
                id={`slider-slides-${group.id}`}
                sensors={slideSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => void onSlideDragEnd(event)}
              >
                <div className="flex max-w-full gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:thin]">
                  <SortableContext
                    items={slideIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    {group.slides.map((slide) => (
                      <SortableSlideCard
                        key={slide.id}
                        slide={slide}
                        onEdit={() => onEditSlide(slide)}
                        onDelete={() => onDeleteSlide(slide)}
                      />
                    ))}
                  </SortableContext>
                  {canCreateSlide ? (
                    <button
                      type="button"
                      onClick={onAddSlide}
                      className={cn(
                        CARD_W,
                        'border-muted-foreground/40 hover:bg-muted/50 shrink-0 snap-start rounded-lg border-2 border-dashed',
                        'flex min-h-[160px] flex-col items-center justify-center gap-1 transition-colors'
                      )}
                    >
                      <Plus
                        className="text-muted-foreground size-8"
                        strokeWidth={1.5}
                      />
                      <span className="text-muted-foreground text-xs">
                        Slayt ekle
                      </span>
                    </button>
                  ) : null}
                </div>
              </DndContext>
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

function SortableSlideCard({
  slide,
  onEdit,
  onDelete,
}: {
  slide: AdminSliderSlideRow
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: canUpdate } = usePermission(SCOPES.SLIDER, PERMISSIONS.UPDATE)
  const { data: canDelete } = usePermission(SCOPES.SLIDER, PERMISSIONS.DELETE)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id,
    disabled: !canUpdate,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isVideo = slide.fileMimeType?.startsWith('video/') ?? false

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative shrink-0',
        CARD_W,
        isDragging && 'ring-primary z-20 opacity-80 ring-2'
      )}
    >
      <div className="border-border bg-card flex flex-col overflow-hidden rounded-lg border shadow-sm">
        <div className="bg-muted/80 flex items-center justify-between gap-0.5 border-b px-1 py-0.5">
          {canUpdate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 cursor-grab touch-none active:cursor-grabbing"
              aria-label="Sürükleyerek sırayı değiştir"
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
          ) : (
            <span className="w-7 shrink-0" aria-hidden />
          )}
          <div className="flex shrink-0 items-center justify-end gap-0.5">
            {canUpdate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Düzenle"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive h-7 w-7"
                aria-label="Sil"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="bg-muted relative aspect-[4/3] w-full">
          {slide.fileViewUrl ? (
            isVideo ? (
              <video
                title={slide.imageAlt || slide.title}
                src={slide.fileViewUrl}
                className="size-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <Image
                src={slide.fileViewUrl}
                alt={slide.imageAlt || slide.title}
                fill
                unoptimized
                className="object-cover"
                sizes="200px"
              />
            )
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
              Önizleme yok
            </div>
          )}
        </div>
        <div className="p-2">
          <p className="line-clamp-2 text-sm font-medium leading-tight">
            {slide.title}
          </p>
          {slide.subtitle ? (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
              {slide.subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
