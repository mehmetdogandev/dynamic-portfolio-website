'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Eye, Plus } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DataTable,
  createIconActionColumn,
  type DataTableColumnMeta,
} from '@/components/ui/data-table'
import {
  getJaponJobStatusLabel,
  type JaponJobStatus,
} from '@/lib/japon/service-job-status'
import { DetailJaponCustomerDialog } from '../customers/detail-japon-customer-dialog'
import { CreateJaponOperationDialog } from './create-japon-operation-dialog'

export type JaponOperationRow = {
  id: string
  customerId: string
  carId: string
  customerName: string
  customerSurname: string
  customerNo: string
  plate: string
  status: JaponJobStatus
  formenLabel: string | null
  serviceFee: string | null
  createdAt: Date
}

export function JaponOperationsDataTable() {
  const router = useRouter()
  const trpc = useTRPC()
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: canCreate } = usePermission(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.CREATE
  )

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
    syncSearchToUrl: true,
    searchParamKey: 'operationSearch',
  })

  const { data: queryData, isLoading } = useQuery({
    ...trpc.japonServiceJob.list.queryOptions(listInput),
  })

  const rows = useMemo(
    () => (queryData?.data ?? []) as JaponOperationRow[],
    [queryData?.data]
  )
  const paginationData = queryData?.pagination
    ? {
        page: queryData.pagination.page,
        limit: queryData.pagination.limit,
        total: queryData.pagination.total,
        totalPages: queryData.pagination.totalPages,
      }
    : undefined

  const formenOptions = useMemo(() => {
    const optionSet = new Set<string>()
    for (const row of rows) {
      if (row.formenLabel) {
        optionSet.add(row.formenLabel)
      }
    }
    return Array.from(optionSet).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [rows])

  const selectedStatusFilter =
    (columnFilters.find((filter) => filter.id === 'status')?.value as string) ||
    'all'
  const selectedFormenFilter =
    (columnFilters.find((filter) => filter.id === 'formen')?.value as string) ||
    'all'

  const setQuickFilter = (id: 'status' | 'formen', value: string) => {
    setColumnFilters((prev) => {
      const next = prev.filter((filter) => filter.id !== id)
      if (value !== 'all') {
        next.push({ id, value })
      }
      return next
    })
  }

  const columns = useMemo<ColumnDef<JaponOperationRow>[]>(
    () => [
      {
        accessorKey: 'plate',
        header: 'Plaka',
        meta: {
          headerClassName: 'w-[140px] min-w-[140px] whitespace-nowrap',
          cellClassName: 'w-[140px] min-w-[140px] whitespace-nowrap',
        } satisfies DataTableColumnMeta,
      },
      {
        id: 'customer',
        header: 'Müşteri',
        enableHiding: false,
        meta: {
          headerClassName: 'min-w-[280px] w-[340px]',
          cellClassName: 'min-w-[280px] w-[340px]',
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <button
            type="button"
            className="block w-full min-w-0 overflow-hidden text-left hover:underline"
            onClick={() => setDetailCustomerId(row.original.customerId)}
          >
            <span className="block w-full truncate font-medium whitespace-nowrap">
              {row.original.customerName} {row.original.customerSurname} -{' '}
              {row.original.customerNo}
            </span>
          </button>
        ),
      },
      {
        accessorKey: 'formenLabel',
        header: 'Formen',
        meta: {
          headerClassName: 'min-w-[170px] w-[190px]',
          cellClassName: 'min-w-[170px] w-[190px]',
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <span className="block w-full truncate whitespace-nowrap">
            {row.original.formenLabel ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Tarih',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleString('tr-TR'),
      },
      {
        accessorKey: 'serviceFee',
        header: 'Ücret',
        cell: ({ row }) =>
          row.original.serviceFee ? `${row.original.serviceFee} ₺` : '—',
      },
      {
        accessorKey: 'status',
        header: 'Durum',
        meta: {
          disableColumnFilter: true,
        } satisfies DataTableColumnMeta,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.status === 'cancelled'
                ? 'destructive'
                : row.original.status === 'none'
                  ? 'outline'
                  : 'secondary'
            }
            className={
              row.original.status === 'completed'
                ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                : row.original.status === 'in_progress'
                  ? 'border-amber-200 bg-amber-100 text-amber-800'
                  : undefined
            }
          >
            {getJaponJobStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      createIconActionColumn<JaponOperationRow>((row) => [
        {
          label: 'Detay',
          icon: Eye,
          onClick: () =>
            router.push(
              `${ADMIN_PANEL_PATH}/japon-oto/operations/${row.original.id}`
            ),
        },
      ]),
    ],
    [router]
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={handleSearchChange}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={paginationData}
        onPaginationChange={handlePaginationChange}
        searchPlaceholder="Plaka, müşteri no veya ad ile ara..."
        toolbarAdd={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              Yeni işlem
            </Button>
          ) : undefined
        }
        toolbarFilters={
          <>
            <Select
              value={selectedStatusFilter}
              onValueChange={(value) => setQuickFilter('status', value)}
            >
              <SelectTrigger className="h-10 w-[170px]">
                <SelectValue placeholder="Durum filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                <SelectItem value="none">Servis yok</SelectItem>
                <SelectItem value="in_progress">Devam ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">Servis iptal</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedFormenFilter}
              onValueChange={(value) => setQuickFilter('formen', value)}
            >
              <SelectTrigger className="h-10 w-[170px]">
                <SelectValue placeholder="Formen filtresi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm formenler</SelectItem>
                {formenOptions.map((formen) => (
                  <SelectItem key={formen} value={formen}>
                    {formen}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
        paginationAlign="end"
        tableMinWidth="min-w-[1120px]"
      />
      {detailCustomerId ? (
        <DetailJaponCustomerDialog
          customerId={detailCustomerId}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDetailCustomerId(null)
            }
          }}
        />
      ) : null}
      <CreateJaponOperationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
