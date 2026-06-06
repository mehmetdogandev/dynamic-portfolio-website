'use client'

import { useMemo } from 'react'
import {
  ColumnDef,
  PaginationState,
  type SortingState,
  type OnChangeFn,
  type RowSelectionState,
  type VisibilityState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useDynamicColumns } from '@/lib/hooks/use-dynamic-columns'

export interface EnhancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageCount?: number
  pagination?: {
    totalPages: number
    total: number
    page: number
    limit: number
  }
  onPaginationChange?: (
    pagination: PaginationState | ((old: PaginationState) => PaginationState)
  ) => void
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  enableColumnFilters?: boolean
  isLoading?: boolean
  toolbar?: React.ReactNode
  toolbarAdd?: React.ReactNode
  toolbarFilters?: React.ReactNode
  mobileSearchFullRow?: boolean
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  onRowClick?: (row: TData) => void
  getRowClassName?: (row: TData) => string | undefined
  filterPanel?: React.ReactNode
  hideColumnsButton?: boolean
  getRowId?: (originalRow: TData, index: number) => string
  initialColumnVisibility?: VisibilityState
  autoHideEmptyColumns?: boolean
  tableMinWidth?: string
  fitContainer?: boolean
  paginationAlign?: 'between' | 'end'
  renderTableBody?: Parameters<
    typeof DataTable<TData, TValue>
  >[0]['renderTableBody']
}

export function EnhancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  pagination,
  onPaginationChange,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
  enableColumnFilters,
  isLoading = false,
  toolbar,
  toolbarAdd,
  toolbarFilters,
  mobileSearchFullRow,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  getRowClassName,
  filterPanel,
  hideColumnsButton,
  getRowId,
  initialColumnVisibility,
  autoHideEmptyColumns,
  tableMinWidth,
  fitContainer,
  paginationAlign,
  renderTableBody,
}: EnhancedDataTableProps<TData, TValue>) {
  const { visibleColumns } = useDynamicColumns({
    columns: columns as ColumnDef<TData>[],
  })

  const combinedToolbar = useMemo(() => {
    if (!toolbar) return undefined
    return toolbar
  }, [toolbar])

  return (
    <DataTable
      columns={visibleColumns}
      data={data}
      searchKey={searchKey}
      searchPlaceholder={searchPlaceholder}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      globalFilter={globalFilter}
      onGlobalFilterChange={onGlobalFilterChange}
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      enableColumnFilters={enableColumnFilters}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isLoading}
      toolbar={combinedToolbar}
      toolbarAdd={toolbarAdd}
      toolbarFilters={toolbarFilters}
      mobileSearchFullRow={mobileSearchFullRow}
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      onRowClick={onRowClick}
      getRowClassName={getRowClassName}
      filterPanel={filterPanel}
      hideColumnsButton={hideColumnsButton}
      getRowId={getRowId}
      initialColumnVisibility={initialColumnVisibility}
      autoHideEmptyColumns={autoHideEmptyColumns}
      tableMinWidth={tableMinWidth}
      fitContainer={fitContainer}
      paginationAlign={paginationAlign}
      renderTableBody={renderTableBody}
    />
  )
}
