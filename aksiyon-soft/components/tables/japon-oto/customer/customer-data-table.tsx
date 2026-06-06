'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { Car, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/hooks/use-rbac'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { useTRPC } from '@/lib/trpc/client'
import { cn } from '@/lib/utils/index'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table'
import {
  getJaponJobStatusLabel,
  type JaponJobStatus,
} from '@/lib/japon/service-job-status'
import { useIsMobile } from '@/lib/hooks/use-is-mobile'
import { buildResponsiveCustomerColumnVisibility } from '../shared/customer-column-visibility'
import { DeleteJaponCustomerDialog } from './delete-customer-dialog'

const TRUNCATE_CELL = 'min-w-0 overflow-hidden'
const COMPACT_META = { cellClassName: TRUNCATE_CELL } as const
const COMPACT_BADGE = 'max-w-[6.5rem] truncate px-1.5 py-0 text-xs font-normal'

export type JaponCustomerRow = {
  id: string
  name: string
  surname: string
  phone: string
  address: string | null
  createdAt: Date
  updatedAt: Date
  carCount: number
  jobCount: number
  lastVisitAt: Date | null
  primaryPlate: string | null
  primaryVehicleType: string | null
  latestJobStatus: JaponJobStatus | null
  latestJobIsCompleted: boolean | null
}

export function JaponCustomerDataTable() {
  const { width } = useIsMobile()
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const {
    handlePaginationChange,
    sorting,
    setSorting,
    search,
    handleSearchChange,
    columnFilters,
    setColumnFilters,
    listInput,
  } = useAdminTableState<'name' | 'surname' | 'phone' | 'createdAt'>({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
    syncSearchToUrl: true,
    searchParamKey: 'customerSearch',
  })

  const [deleteRow, setDeleteRow] = useState<JaponCustomerRow | null>(null)

  const { data: canCreate } = usePermission(
    SCOPES.JAPON_CUSTOMER,
    PERMISSIONS.CREATE
  )

  const { data: queryData, isLoading } = useQuery({
    ...trpc.japonCustomer.list.queryOptions(listInput),
  })

  const rows = (queryData?.data ?? []) as JaponCustomerRow[]
  const paginationData = queryData?.pagination
    ? {
        page: queryData.pagination.page,
        limit: queryData.pagination.limit,
        total: queryData.pagination.total,
        totalPages: queryData.pagination.totalPages,
      }
    : undefined

  const { mutateAsync: deleteAsync } = useMutation(
    trpc.japonCustomer.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Müşteri silindi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.list.queryKey(),
        })
        setDeleteRow(null)
      },
      onError: (error) => toast.error(error.message),
    })
  )

  const columns: ColumnDef<JaponCustomerRow>[] = useMemo(
    () => [
      {
        id: 'fullName',
        accessorFn: (row) => `${row.name} ${row.surname}`,
        header: 'Ad Soyad',
        meta: { ...COMPACT_META, columnLabel: 'Ad', filterKey: 'name' },
        cell: ({ row }) => {
          const customer = row.original
          return (
            <div className="min-w-0 space-y-0.5">
              <span className="block truncate font-medium">
                {customer.name} {customer.surname}
              </span>
              <a
                href={`tel:${customer.phone}`}
                className="block truncate text-xs text-muted-foreground hover:text-foreground md:hidden"
              >
                {customer.phone}
              </a>
              {customer.primaryPlate ? (
                <span className="flex items-center gap-1 truncate text-xs text-muted-foreground md:hidden">
                  <Car className="size-3 shrink-0" />
                  {customer.primaryPlate}
                </span>
              ) : null}
              {customer.primaryVehicleType ? (
                <span className="block truncate text-xs text-muted-foreground md:hidden">
                  {customer.primaryVehicleType}
                </span>
              ) : null}
            </div>
          )
        },
        enableHiding: false,
      },
      {
        id: 'vehicleType',
        accessorFn: (row) => row.primaryVehicleType,
        header: 'Araç',
        meta: { ...COMPACT_META, columnLabel: 'Araç Markası' },
        cell: ({ row }) =>
          row.original.primaryVehicleType ? (
            <div className="min-w-0">
              <span className="block truncate font-medium">
                {row.original.primaryVehicleType}
              </span>
              {row.original.carCount > 1 ? (
                <span className="block truncate text-xs text-muted-foreground">
                  +{row.original.carCount - 1} araç
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        id: 'plate',
        accessorFn: (row) => row.primaryPlate,
        header: 'Plaka',
        meta: { ...COMPACT_META, columnLabel: 'Araç Plakası' },
        cell: ({ row }) =>
          row.original.primaryPlate ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <Car className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium tracking-wide">
                {row.original.primaryPlate}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        id: 'phone',
        accessorKey: 'phone',
        header: 'Tel',
        meta: { ...COMPACT_META, columnLabel: 'Telefon' },
        cell: ({ row }) => (
          <a
            href={`tel:${row.original.phone}`}
            className="block truncate text-sm text-muted-foreground hover:text-foreground"
          >
            {row.original.phone}
          </a>
        ),
      },
      {
        id: 'serviceStatus',
        accessorFn: (row) => row.latestJobStatus,
        header: 'Durum',
        meta: {
          columnLabel: 'Servis Durumu',
          cellClassName: 'min-w-0 whitespace-normal',
        },
        cell: ({ row }) => {
          const status = row.original.latestJobStatus
          if (status === null) {
            return (
              <Badge
                variant="outline"
                className={cn(COMPACT_BADGE, 'text-muted-foreground')}
              >
                Kayıt yok
              </Badge>
            )
          }
          if (status === 'completed') {
            return (
              <Badge
                className={cn(
                  COMPACT_BADGE,
                  'border-emerald-600/20 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400'
                )}
              >
                {getJaponJobStatusLabel(status)}
              </Badge>
            )
          }
          if (status === 'cancelled') {
            return (
              <Badge variant="destructive" className={COMPACT_BADGE}>
                {getJaponJobStatusLabel(status)}
              </Badge>
            )
          }
          if (status === 'in_progress') {
            return (
              <Badge
                className={cn(
                  COMPACT_BADGE,
                  'border-amber-600/20 bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 dark:text-amber-400'
                )}
              >
                {getJaponJobStatusLabel(status)}
              </Badge>
            )
          }
          return (
            <Badge
              variant="outline"
              className={cn(COMPACT_BADGE, 'text-muted-foreground')}
            >
              {getJaponJobStatusLabel(status)}
            </Badge>
          )
        },
        enableSorting: false,
      },
      {
        id: 'address',
        accessorFn: (row) => row.address,
        header: 'Adres',
        meta: {
          cellClassName: 'min-w-0 whitespace-normal align-top',
        },
        cell: ({ row }) => (
          <span
            className="line-clamp-2 text-muted-foreground"
            title={row.original.address ?? undefined}
          >
            {row.original.address ?? '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        id: 'carCount',
        accessorKey: 'carCount',
        header: 'Araç #',
        meta: {
          columnLabel: 'Araç sayısı',
          headerClassName: 'text-center',
          cellClassName: 'text-center',
        },
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.carCount}</Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'jobCount',
        accessorKey: 'jobCount',
        header: 'Servis #',
        meta: {
          columnLabel: 'Servis sayısı',
          headerClassName: 'text-center',
          cellClassName: 'text-center',
        },
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.jobCount}</Badge>
        ),
        enableSorting: false,
      },
      {
        id: 'lastVisitAt',
        accessorFn: (row) => row.lastVisitAt,
        header: 'Ziyaret',
        meta: { ...COMPACT_META, columnLabel: 'Son ziyaret' },
        cell: ({ row }) =>
          row.original.lastVisitAt ? (
            <span className="block truncate text-muted-foreground">
              {new Date(row.original.lastVisitAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        enableSorting: false,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: 'Kayıt',
        meta: { ...COMPACT_META, columnLabel: 'Oluşturulma' },
        cell: ({ row }) => (
          <span className="block truncate text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        meta: {
          columnLabel: 'İşlemler',
          headerClassName: 'w-10 px-1',
          cellClassName: 'w-10 px-1 text-center',
        },
        cell: ({ row }) => (
          <JaponCustomerRowActions
            customer={row.original}
            onView={() =>
              router.push(
                `${ADMIN_PANEL_PATH}/japon-oto/customer/${row.original.id}`
              )
            }
            onEdit={() =>
              router.push(
                `${ADMIN_PANEL_PATH}/japon-oto/customer/${row.original.id}?edit=1`
              )
            }
            onDelete={() => setDeleteRow(row.original)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [router]
  )

  const defaultColumnVisibility = useMemo(
    () => buildResponsiveCustomerColumnVisibility(width),
    [width]
  )

  return (
    <Card className="w-full">
      <CardHeader className="space-y-0">
        <CardTitle>Müşteriler</CardTitle>
        <p className="text-sm text-muted-foreground">
          Japon Oto müşteri, araç ve servis kayıtları.
        </p>
      </CardHeader>
      <CardContent className="min-w-0">
        <EnhancedDataTable<JaponCustomerRow, unknown>
          columns={columns}
          data={rows}
          globalFilter={search}
          onGlobalFilterChange={handleSearchChange}
          searchPlaceholder="Ad, soyad, telefon veya plaka ara"
          isLoading={isLoading}
          pagination={paginationData}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          getRowId={(row) => row.id}
          mobileSearchFullRow
          autoHideEmptyColumns={false}
          initialColumnVisibility={defaultColumnVisibility}
          fitContainer
          toolbarAdd={
            canCreate ? (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  router.push(`${ADMIN_PANEL_PATH}/japon-oto/customer/new`)
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni müşteri
              </Button>
            ) : null
          }
        />
        {deleteRow ? (
          <DeleteJaponCustomerDialog
            row={deleteRow}
            open={true}
            onOpenChange={(open) => !open && setDeleteRow(null)}
            onConfirm={async () => {
              await deleteAsync({ id: deleteRow.id })
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

function JaponCustomerRowActions({
  customer,
  onView,
  onEdit,
  onDelete,
}: {
  customer: JaponCustomerRow
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { data: canRead } = usePermission(
    SCOPES.JAPON_CUSTOMER,
    PERMISSIONS.READ
  )
  const { data: canUpdate } = usePermission(
    SCOPES.JAPON_CUSTOMER,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.JAPON_CUSTOMER,
    PERMISSIONS.DELETE
  )

  if (!canRead && !canUpdate && !canDelete) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{customer.name} işlemleri</span>
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
