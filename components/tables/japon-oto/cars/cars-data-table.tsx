'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import { DataTable, createIconActionColumn } from '@/components/ui/data-table'

export type JaponCarListRow = {
  id: string
  plate: string
  vehicleType: string
  color: string
  km: number
  ownerName: string
  ownerSurname: string
  ownerCustomerNo: string
}

export function JaponCarsDataTable() {
  const router = useRouter()
  const trpc = useTRPC()

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
    defaultSort: { id: 'plate', desc: false },
    syncSearchToUrl: true,
    searchParamKey: 'carSearch',
  })

  const { data: queryData, isLoading } = useQuery({
    ...trpc.japonCar.list.queryOptions(listInput),
  })

  const rows = (queryData?.data ?? []) as JaponCarListRow[]
  const paginationData = queryData?.pagination
    ? {
        page: queryData.pagination.page,
        limit: queryData.pagination.limit,
        total: queryData.pagination.total,
        totalPages: queryData.pagination.totalPages,
      }
    : undefined

  const columns = useMemo<ColumnDef<JaponCarListRow>[]>(
    () => [
      { accessorKey: 'plate', header: 'Plaka' },
      { accessorKey: 'vehicleType', header: 'Araç tipi' },
      { accessorKey: 'color', header: 'Renk' },
      {
        accessorKey: 'km',
        header: 'KM',
        cell: ({ row }) => row.original.km.toLocaleString('tr-TR'),
      },
      {
        id: 'owner',
        header: 'Güncel sahip',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.ownerName} {row.original.ownerSurname}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.ownerCustomerNo}
            </p>
          </div>
        ),
      },
      createIconActionColumn<JaponCarListRow>((row) => [
        {
          label: 'Detay',
          icon: Eye,
          onClick: () =>
            router.push(
              `${ADMIN_PANEL_PATH}/japon-oto/cars/${row.original.id}`
            ),
        },
      ]),
    ],
    [router]
  )

  return (
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
      searchPlaceholder="Plaka veya müşteri ile ara..."
      paginationAlign="end"
    />
  )
}
