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
import Image from 'next/image'
import { isFooterSocialKnownPlatform } from '@/lib/website/social-platforms'
import { FooterSocialPlatformIcon } from './footer-social-platform-icon'
import { CreateFooterSocialDialog } from './create-footer-social-dialog'
import { DeleteFooterSocialDialog } from './delete-footer-social-dialog'
import { UpdateFooterSocialDialog } from './update-footer-social-dialog'
import type { AdminFooterSocialRow } from './types'

export function FooterSocialDataTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data, isLoading, isError, error } = useQuery(
    trpc.footerSocial.list.queryOptions()
  )
  const [rows, setRows] = useState<AdminFooterSocialRow[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    setRows((data ?? []) as AdminFooterSocialRow[])
  }, [data])

  const orderedIds = useMemo(() => rows.map((row) => row.id), [rows])
  const { mutateAsync: reorderAsync } = useMutation(
    trpc.footerSocial.reorder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.footerSocial.list.queryKey(),
        })
      },
    })
  )
  const { mutateAsync: toggleActiveAsync } = useMutation(
    trpc.footerSocial.toggleActive.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.footerSocial.list.queryKey(),
        })
      },
      onError: (err) => toast.error(err.message),
    })
  )

  const { data: canCreate } = usePermission(
    SCOPES.FOOTER_NAV,
    PERMISSIONS.CREATE
  )
  const { data: canUpdate } = usePermission(
    SCOPES.FOOTER_NAV,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.FOOTER_NAV,
    PERMISSIONS.DELETE
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminFooterSocialRow | null>(null)
  const [deleteRow, setDeleteRow] = useState<AdminFooterSocialRow | null>(null)
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

  const onToggleActive = async (
    row: AdminFooterSocialRow,
    isActive: boolean
  ) => {
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
        <CardTitle>Sosyal medya</CardTitle>
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Yeni hesap
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Henüz sosyal medya kaydı yok.
          </p>
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
                    <TableHead>Platform</TableHead>
                    <TableHead>URL</TableHead>
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
                      <SortableFooterSocialRow
                        key={row.id}
                        row={row}
                        canUpdate={!!canUpdate}
                        canDelete={!!canDelete}
                        toggling={togglingId === row.id}
                        onToggleActive={onToggleActive}
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
        <CreateFooterSocialDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
        {editRow ? (
          <UpdateFooterSocialDialog
            row={editRow}
            open={true}
            onOpenChange={(open) => !open && setEditRow(null)}
          />
        ) : null}
        {deleteRow ? (
          <DeleteFooterSocialDialog
            row={deleteRow}
            open={true}
            onOpenChange={(open) => !open && setDeleteRow(null)}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function SortableFooterSocialRow({
  row,
  canUpdate,
  canDelete,
  toggling,
  onToggleActive,
  onEdit,
  onDelete,
}: {
  row: AdminFooterSocialRow
  canUpdate: boolean
  canDelete: boolean
  toggling: boolean
  onToggleActive: (row: AdminFooterSocialRow, isActive: boolean) => void
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
      <TableCell>
        <span className="flex items-center gap-2 font-medium">
          {row.type === 'IMAGE' && row.iconPreviewUrl ? (
            <Image
              src={row.iconPreviewUrl}
              alt=""
              width={16}
              height={16}
              className="size-4 object-contain"
              unoptimized
            />
          ) : isFooterSocialKnownPlatform(row.platform) ? (
            <FooterSocialPlatformIcon
              platform={row.platform}
              className="h-4 w-4"
            />
          ) : null}
          {row.displayName}
        </span>
      </TableCell>
      <TableCell className="max-w-[280px] truncate">{row.url}</TableCell>
      <TableCell>
        <Switch
          checked={row.isActive}
          disabled={!canUpdate || toggling}
          onCheckedChange={(checked) => onToggleActive(row, checked)}
          aria-label={`${row.displayName} aktif`}
        />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      </TableCell>
    </TableRow>
  )
}
