'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { Eye, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/lib/trpc/client'
import { useAdminTableState } from '@/lib/hooks/use-admin-table-state'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { Button } from '@/components/ui/button'
import {
  DataTable,
  createIconActionColumn,
  type TableIconAction,
} from '@/components/ui/data-table'
import { DeleteJaponCustomerDialog } from '../customer/delete-customer-dialog'
import { CreateJaponCustomerDialog } from './create-japon-customer-dialog'
import { UpdateJaponCustomerDialog } from './update-japon-customer-dialog'
import { DetailJaponCustomerDialog } from './detail-japon-customer-dialog'
import { CustomerRelationsDialog } from './customer-relations-dialog'

export type JaponCustomerListRow = {
  id: string
  customerNo: string
  name: string
  surname: string
  phone: string
  address: string | null
  createdAt: Date
  carCount: number
  activePlates: string[]
}

export function JaponCustomersDataTable() {
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
  } = useAdminTableState({
    defaultPageSize: 10,
    defaultSort: { id: 'name', desc: false },
    syncSearchToUrl: true,
    searchParamKey: 'customerSearch',
  })

  const [deleteRow, setDeleteRow] = useState<JaponCustomerListRow | null>(null)
  const [expandedPlateRows, setExpandedPlateRows] = useState<Set<string>>(
    new Set()
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<JaponCustomerListRow | null>(null)
  const [detailRow, setDetailRow] = useState<JaponCustomerListRow | null>(null)
  const [relationsRow, setRelationsRow] = useState<JaponCustomerListRow | null>(
    null
  )

  const { data: canCreate } = usePermission(
    SCOPES.JAPON_OTO_CUSTOMER,
    PERMISSIONS.CREATE
  )
  const { data: canUpdate } = usePermission(
    SCOPES.JAPON_OTO_CUSTOMER,
    PERMISSIONS.UPDATE
  )
  const { data: canDelete } = usePermission(
    SCOPES.JAPON_OTO_CUSTOMER,
    PERMISSIONS.DELETE
  )

  const { data: queryData, isLoading } = useQuery({
    ...trpc.japonCustomer.list.queryOptions(listInput),
  })

  const rows: JaponCustomerListRow[] = useMemo(
    () =>
      (queryData?.data ?? []).map((r) => ({
        id: r.id,
        customerNo: r.customerNo,
        name: r.name,
        surname: r.surname,
        phone: r.phone,
        address: r.address,
        createdAt: r.createdAt,
        carCount: r.carCount,
        activePlates: r.activePlates ?? [],
      })),
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

  const { mutateAsync: deleteAsync } = useMutation(
    trpc.japonCustomer.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Müşteri silindi')
        await queryClient.invalidateQueries({
          queryKey: trpc.japonCustomer.list.queryKey(),
        })
        setDeleteRow(null)
      },
      onError: (e) => toast.error(e.message),
    })
  )

  const columns = useMemo<ColumnDef<JaponCustomerListRow>[]>(
    () => [
      { accessorKey: 'customerNo', header: 'Müşteri no' },
      { accessorKey: 'name', header: 'Ad' },
      { accessorKey: 'surname', header: 'Soyad' },
      { accessorKey: 'phone', header: 'Telefon' },
      {
        id: 'activePlates',
        header: 'Araçlar',
        cell: ({ row }) => {
          const plates = row.original.activePlates
          if (plates.length === 0) {
            return '-'
          }

          const isExpanded = expandedPlateRows.has(row.original.id)
          const visiblePlates = isExpanded ? plates : plates.slice(0, 2)

          return (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {visiblePlates.map((plate) => (
                  <span
                    key={plate}
                    className="inline-flex rounded border px-1.5 py-0.5 text-xs"
                  >
                    {plate}
                  </span>
                ))}
              </div>
              {plates.length > 2 ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() =>
                    setExpandedPlateRows((prev) => {
                      const next = new Set(prev)
                      if (next.has(row.original.id)) {
                        next.delete(row.original.id)
                      } else {
                        next.add(row.original.id)
                      }
                      return next
                    })
                  }
                >
                  {isExpanded
                    ? 'Plakaları gizle'
                    : `${plates.length - 2} plaka daha göster`}
                </button>
              ) : null}
            </div>
          )
        },
      },
      {
        accessorKey: 'address',
        header: 'Adres',
        cell: ({ row }) => row.original.address || '-',
      },
      {
        accessorKey: 'createdAt',
        header: 'Kayıt',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('tr-TR'),
      },
      createIconActionColumn<JaponCustomerListRow>((row) => {
        const actions: TableIconAction[] = [
          {
            label: 'Detay',
            icon: Eye,
            onClick: () => setDetailRow(row.original),
          },
          {
            label: 'İlişkiler',
            icon: Link2,
            onClick: () => setRelationsRow(row.original),
          },
        ]
        if (canUpdate) {
          actions.push({
            label: 'Düzenle',
            icon: Pencil,
            onClick: () => setEditRow(row.original),
          })
        }
        if (canDelete) {
          actions.push({
            label: 'Sil',
            icon: Trash2,
            variant: 'destructive',
            onClick: () => setDeleteRow(row.original),
          })
        }
        return actions
      }),
    ],
    [canUpdate, canDelete, expandedPlateRows]
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
        searchPlaceholder="Müşteri no, ad, telefon veya plaka..."
        toolbarAdd={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Yeni müşteri
            </Button>
          ) : undefined
        }
        paginationAlign="end"
      />

      {deleteRow ? (
        <DeleteJaponCustomerDialog
          open={true}
          row={{
            ...deleteRow,
            updatedAt: deleteRow.createdAt,
            jobCount: 0,
            lastVisitAt: null,
            primaryPlate: null,
            primaryVehicleType: null,
            latestJobStatus: null,
            latestJobIsCompleted: null,
          }}
          onOpenChange={(open) => !open && setDeleteRow(null)}
          onConfirm={async () => {
            await deleteAsync({ id: deleteRow.id })
          }}
        />
      ) : null}

      <CreateJaponCustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      {editRow ? (
        <UpdateJaponCustomerDialog
          row={editRow}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setEditRow(null)
            }
          }}
        />
      ) : null}
      {detailRow ? (
        <DetailJaponCustomerDialog
          customerId={detailRow.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setDetailRow(null)
            }
          }}
        />
      ) : null}
      {relationsRow ? (
        <CustomerRelationsDialog
          customerId={relationsRow.id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setRelationsRow(null)
            }
          }}
        />
      ) : null}
    </>
  )
}
