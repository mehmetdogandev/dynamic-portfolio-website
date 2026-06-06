'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Eye,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { useTRPC } from '@/lib/trpc/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CreateSiteNavDialog } from './create-site-nav-dialog'
import { DeleteSiteNavDialog } from './delete-site-nav-dialog'
import { DetailSiteNavDialog } from './detail-site-nav-dialog'
import { UpdateSiteNavDialog } from './update-site-nav-dialog'
import type { AdminSiteNavRow, SiteNavVariant } from './types'

const CONFIG = {
  header: {
    scope: SCOPES.HEADER_NAV,
    title: 'Header menü linkleri',
    empty: 'Henüz header menü öğesi yok.',
  },
  footer: {
    scope: SCOPES.FOOTER_NAV,
    title: 'Footer menü linkleri',
    empty: 'Henüz footer menü öğesi yok.',
  },
} as const

export function SiteNavDataTable({ variant }: { variant: SiteNavVariant }) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const api = variant === 'header' ? trpc.headerNav : trpc.footerNav
  const { scope, title, empty } = CONFIG[variant]

  const { data, isLoading, isError, error } = useQuery(api.list.queryOptions())
  const [rows, setRows] = useState<AdminSiteNavRow[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    setRows((data ?? []) as AdminSiteNavRow[])
  }, [data])

  const orderedIds = useMemo(() => rows.map((row) => row.id), [rows])
  const { mutateAsync: reorderAsync } = useMutation(
    api.reorder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: api.list.queryKey() })
      },
    })
  )
  const { mutateAsync: toggleActiveAsync } = useMutation(
    api.toggleActive.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: api.list.queryKey() })
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const { data: canCreate } = usePermission(scope, PERMISSIONS.CREATE)
  const { data: canUpdate } = usePermission(scope, PERMISSIONS.UPDATE)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<AdminSiteNavRow | null>(null)
  const [editRow, setEditRow] = useState<AdminSiteNavRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminSiteNavRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !canUpdate) return
    const oldIndex = rows.findIndex((row) => row.id === active.id)
    const newIndex = rows.findIndex((row) => row.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const prevRows = rows
    const nextRows = arrayMove(rows, oldIndex, newIndex)
    setRows(nextRows)
    try {
      await reorderAsync({ orderedIds: nextRows.map((row) => row.id) })
    } catch (err) {
      setRows(prevRows)
      toast.error(err instanceof Error ? err.message : 'Sıralama kaydedilemedi')
    }
  }

  const onToggleActive = async (row: AdminSiteNavRow, isActive: boolean) => {
    if (!canUpdate) return
    setTogglingId(row.id)
    const prevRows = rows
    setRows((current) =>
      current.map((r) => (r.id === row.id ? { ...r, isActive } : r))
    )
    try {
      await toggleActiveAsync({ id: row.id, isActive })
    } catch {
      setRows(prevRows)
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="text-destructive text-sm">
        {error?.message ?? 'Yüklenemedi'}
      </p>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{title}</CardTitle>
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni link
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <div className="rounded-md border">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Etiket</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="w-24">Aktif</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={orderedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {rows.map((row) => (
                      <SortableSiteNavRow
                        key={row.id}
                        variant={variant}
                        row={row}
                        canUpdate={!!canUpdate}
                        toggling={togglingId === row.id}
                        onToggleActive={onToggleActive}
                        onView={() => setDetailRow(row)}
                        onEdit={() => setEditRow(row)}
                        onDelete={() => setDeleteRow(row)}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
        <CreateSiteNavDialog
          variant={variant}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
        {detailRow ? (
          <DetailSiteNavDialog
            row={detailRow}
            open={true}
            onOpenChange={(open) => !open && setDetailRow(null)}
          />
        ) : null}
        {editRow ? (
          <UpdateSiteNavDialog
            variant={variant}
            row={editRow}
            open={true}
            onOpenChange={(open) => !open && setEditRow(null)}
          />
        ) : null}
        {deleteRow ? (
          <DeleteSiteNavDialog
            variant={variant}
            row={deleteRow}
            open={true}
            onOpenChange={(open) => !open && setDeleteRow(null)}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function SortableSiteNavRow({
  variant,
  row,
  canUpdate,
  toggling,
  onToggleActive,
  onView,
  onEdit,
  onDelete,
}: {
  variant: SiteNavVariant
  row: AdminSiteNavRow
  canUpdate: boolean
  toggling: boolean
  onToggleActive: (row: AdminSiteNavRow, isActive: boolean) => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !canUpdate })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const { scope } = CONFIG[variant]

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-muted/60' : undefined}
    >
      <TableCell>
        {canUpdate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        ) : null}
      </TableCell>
      <TableCell className="font-medium">{row.label}</TableCell>
      <TableCell className="max-w-[240px] truncate">{row.href}</TableCell>
      <TableCell>
        <Switch
          checked={row.isActive}
          disabled={!canUpdate || toggling}
          onCheckedChange={(checked) => onToggleActive(row, checked)}
          aria-label={`${row.label} aktif`}
        />
      </TableCell>
      <TableCell className="text-right">
        <SiteNavRowActions
          scope={scope}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  )
}

function SiteNavRowActions({
  scope,
  onView,
  onEdit,
  onDelete,
}: {
  scope: (typeof SCOPES)[keyof typeof SCOPES]
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: canRead } = usePermission(scope, PERMISSIONS.READ)
  const { data: canUpdate } = usePermission(scope, PERMISSIONS.UPDATE)
  const { data: canDelete } = usePermission(scope, PERMISSIONS.DELETE)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canRead ? (
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" />
            Detay
          </DropdownMenuItem>
        ) : null}
        {canUpdate ? (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
