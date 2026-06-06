'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  Download,
  Edit,
  Eye,
  Package,
  Plus,
  Trash2,
} from 'lucide-react'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { PERMISSIONS } from '@/lib/db/schema'
import { CHANNEL_SCOPE } from '@/lib/radio-mobile/channels'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'
import {
  CHANNEL_TO_ROUTER,
  type BuildRow,
  type RadioMobileRouterKey,
} from './types'
import { useChannelRouter } from './use-channel-router'
import { ChannelPublicToolbar } from './channel-public-toolbar'
import { CreateBuildDialog } from './create-build-dialog'
import { BuildDetailDialog } from './build-detail-dialog'
import { EditBuildDialog } from './edit-build-dialog'
import { DeleteBuildDialog } from './delete-build-dialog'

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function RadioMobileBuildDataTable({
  channel,
  routerKey = CHANNEL_TO_ROUTER[channel],
  uploadDisabled = false,
}: {
  channel: RadioMobileChannelValue
  routerKey?: RadioMobileRouterKey
  uploadDisabled?: boolean
}) {
  const queryClient = useQueryClient()
  const scope = CHANNEL_SCOPE[channel]
  const channelRouter = useChannelRouter(routerKey)

  const { data: canCreate } = usePermission(scope, PERMISSIONS.CREATE)
  const { data: canUpdate } = usePermission(scope, PERMISSIONS.UPDATE)
  const { data: canDelete } = usePermission(scope, PERMISSIONS.DELETE)
  const { data: canRead } = usePermission(scope, PERMISSIONS.READ)

  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>(
    'active'
  )
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editBuild, setEditBuild] = useState<BuildRow | null>(null)
  const [deleteBuild, setDeleteBuild] = useState<BuildRow | null>(null)

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState<
    'versionName' | 'displayName' | 'publishedAt' | 'createdAt'
  >({
    defaultPageSize: 10,
    defaultSort: { id: 'versionName', desc: true },
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

  const { data: listData, isLoading } = useQuery({
    ...channelRouter.list.queryOptions(queryInput),
  })

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: channelRouter.list.queryKey() })
  }

  const updateMutation = useMutation(
    channelRouter.update.mutationOptions({
      onSuccess: invalidateList,
    })
  )

  const rows = (listData?.data ?? []) as BuildRow[]

  const paginationMeta = listData?.pagination
    ? {
        page: listData.pagination.page,
        limit: listData.pagination.limit,
        total: listData.pagination.total,
        totalPages: listData.pagination.totalPages,
      }
    : undefined

  const columns = useMemo<ColumnDef<BuildRow>[]>(
    () => [
      {
        accessorKey: 'versionName',
        header: 'Sürüm',
        meta: { columnLabel: 'Sürüm' },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="hidden size-4 text-muted-foreground sm:block" />
            <span className="font-medium">{row.original.versionName}</span>
            {row.original.isStable ? (
              <Badge variant="secondary">Stabil</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'displayName',
        header: 'Dosya adı',
        meta: { columnLabel: 'Dosya adı' },
      },
      {
        id: 'size',
        header: 'Boyut',
        meta: { columnLabel: 'Boyut', disableColumnFilter: true },
        enableSorting: false,
        cell: ({ row }) => formatMb(row.original.sizeBytes),
      },
      {
        id: 'public',
        header: 'Sayfada yayınla',
        meta: { columnLabel: 'Public', disableColumnFilter: true },
        enableSorting: false,
        cell: ({ row }) =>
          canUpdate ? (
            <Switch
              checked={row.original.isPublicOnSite}
              onCheckedChange={(checked) =>
                updateMutation.mutate({
                  id: row.original.id,
                  isPublicOnSite: checked,
                })
              }
            />
          ) : row.original.isPublicOnSite ? (
            'Evet'
          ) : (
            'Hayır'
          ),
      },
      {
        accessorKey: 'publishedAt',
        header: 'Yayın tarihi',
        meta: { columnLabel: 'Yayın tarihi' },
        cell: ({ row }) =>
          new Date(row.original.publishedAt).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
      },
      createIconActionColumn<BuildRow>((row) => {
        const actions = []
        if (canRead) {
          actions.push({
            icon: Eye,
            label: 'Detay',
            onClick: () => setDetailId(row.original.id),
          })
          actions.push({
            icon: Download,
            label: 'İndir',
            onClick: () => {
              window.open(
                `/api/radio-mobile/download/${row.original.id}`,
                '_blank'
              )
            },
          })
        }
        if (canUpdate) {
          actions.push({
            icon: Edit,
            label: 'Düzenle',
            onClick: () => setEditBuild(row.original),
          })
        }
        if (canDelete) {
          actions.push({
            icon: Trash2,
            label: 'Sil',
            variant: 'destructive' as const,
            onClick: () => setDeleteBuild(row.original),
          })
        }
        return actions
      }),
    ],
    [canRead, canUpdate, canDelete, updateMutation]
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Sürüm ara..."
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
          <div className="flex flex-wrap items-center gap-3">
            {canCreate && !uploadDisabled ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni ekle
              </Button>
            ) : null}
            <ChannelPublicToolbar channel={channel} routerKey={routerKey} />
          </div>
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

      <CreateBuildDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        routerKey={routerKey}
        onSuccess={invalidateList}
      />

      <BuildDetailDialog
        buildId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        routerKey={routerKey}
      />

      <EditBuildDialog
        build={editBuild}
        open={!!editBuild}
        onOpenChange={(o) => !o && setEditBuild(null)}
        routerKey={routerKey}
        onSuccess={invalidateList}
      />

      <DeleteBuildDialog
        build={deleteBuild}
        open={!!deleteBuild}
        onOpenChange={(o) => !o && setDeleteBuild(null)}
        routerKey={routerKey}
        onSuccess={invalidateList}
      />
    </>
  )
}
