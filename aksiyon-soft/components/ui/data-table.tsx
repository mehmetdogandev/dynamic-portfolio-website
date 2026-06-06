/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type RowSelectionState,
  type Row,
  type Column,
  type Table as ReactTable,
} from '@tanstack/react-table'
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  Children,
  cloneElement,
  isValidElement,
} from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/index'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Search,
} from 'lucide-react'
import {
  ACTIONS_COLUMN_ID,
  isNonFilterableColumnId,
  createIconActionColumn,
  type TableIconAction,
} from '@/components/ui/data-table-icon-actions'
import {
  DataTableDnd,
  type DataTableDndConfig,
} from '@/components/ui/data-table-dnd'

export { createIconActionColumn, type TableIconAction }
export type { DataTableDndConfig }

function formatNumericForDisplay(value: string | number): string {
  const numericValue =
    typeof value === 'number' ? value : Number(value.replace(',', '.'))

  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })
}

function normalizePrimitiveCellValue(value: React.ReactNode): React.ReactNode {
  if (typeof value === 'number') {
    return formatNumericForDisplay(value)
  }

  if (typeof value !== 'string') {
    return value
  }

  const raw = value.trim()
  if (!raw) {
    return value
  }

  // Normalize DB decimal numeric strings (e.g. 1250.000, 17.250) while keeping
  // plain integer-like strings intact (they might be codes/IDs).
  if (/^-?\d+[.,]\d+$/.test(raw)) {
    return formatNumericForDisplay(raw)
  }

  return value
}

function normalizeCellNode(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === 'boolean') {
    return node
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return normalizePrimitiveCellValue(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => normalizeCellNode(child))
  }

  if (isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode }
    if (props && 'children' in props) {
      const normalizedChildren = normalizeCellNode(props.children)
      return cloneElement(node, undefined, normalizedChildren)
    }
  }

  return node
}

// Utility function to detect which columns have data
function getColumnsWithData<TData>(
  data: TData[],
  columns: ColumnDef<TData, any>[]
): Set<string> {
  const columnsWithData = new Set<string>()

  if (!data.length) {
    return columnsWithData
  }

  columns.forEach((column) => {
    if ('accessorKey' in column && column.accessorKey) {
      const accessorKey = column.accessorKey as string

      // Check if any row has meaningful data for this column
      const hasData = data.some((row) => {
        const value = (row as any)[accessorKey]

        // Consider data as existing if:
        // - Not null, undefined, or empty string
        // - For arrays: not empty
        // - For objects: not empty object
        if (value === null || value === undefined || value === '') {
          return false
        }

        // For arrays, check if they have content
        if (Array.isArray(value)) {
          return value.length > 0
        }

        // For objects, check if they have properties
        // Note: Date objects are special - they should always be considered as having data
        if (typeof value === 'object') {
          // Date objects should always be considered as having data
          if (value instanceof Date) {
            return true
          }
          return Object.keys(value).length > 0
        }

        // For primitive values, consider any non-empty value as data
        return true
      })

      if (hasData) {
        columnsWithData.add(accessorKey)
      }
    } else if (
      'accessorFn' in column &&
      column.accessorFn &&
      'id' in column &&
      column.id
    ) {
      // For columns with accessorFn (computed), check if any row has meaningful data
      const accessorFn = column.accessorFn as (row: TData) => unknown
      const hasData = data.some((row) => {
        const value = accessorFn(row)
        if (value === null || value === undefined || value === '') {
          return false
        }
        if (typeof value === 'string' && value.trim() === '-') {
          return false
        }
        return true
      })
      if (hasData) {
        columnsWithData.add(column.id)
      }
    } else if ('id' in column && column.id) {
      // Keep custom/computed columns visible by default to avoid accidental
      // hiding for columns whose values are rendered in custom cell functions.
      columnsWithData.add(column.id)
    }
  })

  return columnsWithData
}

interface Pagination {
  totalPages: number
  total: number
  page: number
  limit: number
}
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  // Server-side pagination desteği
  pageCount?: number
  pagination?: Pagination
  onPaginationChange?: (
    pagination: PaginationState | ((old: PaginationState) => PaginationState)
  ) => void
  // Server-side filtering desteği
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
  // Loading state
  isLoading?: boolean
  // Ek toolbar bileşenleri (deprecated — prefer toolbarAdd / toolbarFilters)
  toolbar?: React.ReactNode
  /** Primary action after global search (e.g. "Yeni ekle"). */
  toolbarAdd?: React.ReactNode
  /** Filters between add button and column menu. */
  toolbarFilters?: React.ReactNode
  // Mobilde arama çubuğunu tek satırda, toolbar'ı alt satırda göstermek için opsiyonel düzen
  mobileSearchFullRow?: boolean
  /** Controlled column filters (server-side when onColumnFiltersChange is set). */
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
  enableColumnFilters?: boolean
  paginationAlign?: 'between' | 'end'
  /** Replace default table body (e.g. for DnD rows). Not used while `isLoading`. */
  renderTableBody?: (table: ReactTable<TData>) => React.ReactNode
  /** Wraps the whole `<table>` in DnD context (must not be placed inside `<tbody>`). */
  tableDnd?: DataTableDndConfig
  // Optional external sorting state (for server-side sorting)
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  // Row selection state
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  // Row click handler
  onRowClick?: (row: TData) => void
  // Row className getter
  getRowClassName?: (row: TData) => string | undefined
  // Filter panel to render below toolbar
  filterPanel?: React.ReactNode
  // Hide columns button
  hideColumnsButton?: boolean
  /** Stable row id for selection across server-side pages (e.g. primary key). */
  getRowId?: (originalRow: TData, index: number) => string
  /** Initial column visibility (column id or accessorKey). */
  initialColumnVisibility?: VisibilityState
  /**
   * When false, all hideable columns stay available in "Sütunlar" and visibility
   * follows `initialColumnVisibility` instead of auto-hiding empty columns.
   */
  autoHideEmptyColumns?: boolean
  /** Minimum table width class (e.g. `min-w-[1100px]`) for horizontal scroll on narrow viewports. */
  tableMinWidth?: string
  /**
   * When true (default if `tableMinWidth` is omitted), table uses `w-full table-fixed`
   * so columns share viewport width instead of expanding past the container.
   */
  fitContainer?: boolean
}

export type DataTableColumnMeta = {
  columnLabel?: string
  headerClassName?: string
  cellClassName?: string
  disableColumnFilter?: boolean
  filterPlaceholder?: string
  /** API / columnFilters record key when different from column id */
  filterKey?: string
  /** Renders a select instead of text input in the column filter row */
  filterSelectOptions?: { value: string; label: string }[]
}

function getDataTableColumnMeta<TData>(
  column: Column<TData, unknown>
): DataTableColumnMeta | undefined {
  return column.columnDef.meta as DataTableColumnMeta | undefined
}

function ColumnVisibilityMenu<TData>({
  table,
  hideColumnsButton,
  autoHideEmptyColumns,
  columnsWithData,
  isLoading,
  dataLength,
  getColumnLabel,
  triggerClassName,
}: {
  table: ReactTable<TData>
  hideColumnsButton: boolean
  autoHideEmptyColumns: boolean
  columnsWithData: Set<string>
  isLoading: boolean
  dataLength: number
  getColumnLabel: (column: Column<TData, unknown>) => string
  triggerClassName?: string
}) {
  if (hideColumnsButton) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={cn('h-10', triggerClassName)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Sütunlar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-37.5">
        {table
          .getAllColumns()
          .filter(
            (column) =>
              column.getCanHide() &&
              (autoHideEmptyColumns === false ||
                isLoading ||
                dataLength === 0 ||
                columnsWithData.has(column.id) ||
                ('accessorKey' in column.columnDef &&
                  column.columnDef.accessorKey &&
                  columnsWithData.has(column.columnDef.accessorKey as string)))
          )
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {getColumnLabel(column)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Ara...',
  pagination,
  onPaginationChange,
  globalFilter,
  onGlobalFilterChange,
  isLoading = false,
  toolbar,
  toolbarAdd,
  toolbarFilters,
  mobileSearchFullRow,
  sorting: externalSorting,
  onSortingChange: externalOnSortingChange,
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
  onRowClick,
  getRowClassName,
  filterPanel,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange: externalOnColumnFiltersChange,
  enableColumnFilters = true,
  paginationAlign = 'end',
  renderTableBody,
  tableDnd,
  hideColumnsButton = false,
  getRowId,
  initialColumnVisibility,
  autoHideEmptyColumns = true,
  tableMinWidth,
  fitContainer = !tableMinWidth,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [internalColumnFilters, setInternalColumnFilters] =
    useState<ColumnFiltersState>([])
  const columnFilters = externalColumnFilters ?? internalColumnFilters
  const setColumnFilters =
    externalOnColumnFiltersChange ?? setInternalColumnFilters
  const [internalRowSelection, setInternalRowSelection] =
    useState<RowSelectionState>({})

  // Use external row selection if provided, otherwise use internal state
  const rowSelection = externalRowSelection ?? internalRowSelection
  const setRowSelection = useCallback(
    (
      updater:
        | RowSelectionState
        | ((old: RowSelectionState) => RowSelectionState)
    ) => {
      if (externalOnRowSelectionChange) {
        if (typeof updater === 'function') {
          const current = externalRowSelection ?? internalRowSelection
          externalOnRowSelectionChange(updater(current))
        } else {
          externalOnRowSelectionChange(updater)
        }
      } else {
        if (typeof updater === 'function') {
          setInternalRowSelection(updater)
        } else {
          setInternalRowSelection(updater)
        }
      }
    },
    [externalOnRowSelectionChange, externalRowSelection, internalRowSelection]
  )

  // Automatically determine which columns have data and hide empty ones
  const columnsWithData = useMemo(() => {
    const result = getColumnsWithData(data, columns)

    // If no data but columns exist, show all columns by default
    if (data.length === 0) {
      const allColumns = new Set<string>()
      columns.forEach((column) => {
        if ('accessorKey' in column && column.accessorKey) {
          allColumns.add(column.accessorKey as string)
        } else if ('id' in column && column.id) {
          allColumns.add(column.id)
        }
      })
      return allColumns
    }

    return result
  }, [data, columns])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => initialColumnVisibility ?? {}
  )

  useEffect(() => {
    if (initialColumnVisibility) {
      setColumnVisibility(initialColumnVisibility)
    }
  }, [initialColumnVisibility])

  // Auto-hide columns without data (opt-out via autoHideEmptyColumns={false})
  useEffect(() => {
    if (!autoHideEmptyColumns) {
      return
    }

    const newVisibility: VisibilityState = {
      ...initialColumnVisibility,
    }

    columns.forEach((column) => {
      if ('accessorKey' in column && column.accessorKey) {
        const accessorKey = column.accessorKey as string
        newVisibility[accessorKey] =
          isLoading || data.length === 0 || columnsWithData.has(accessorKey)
      } else if ('id' in column && column.id) {
        newVisibility[column.id] =
          isLoading || data.length === 0 || columnsWithData.has(column.id)
      }
    })

    setColumnVisibility((prev) => {
      const hasChanged =
        Object.keys(newVisibility).some(
          (key) => prev[key] !== newVisibility[key]
        ) || Object.keys(prev).length !== Object.keys(newVisibility).length

      return hasChanged ? newVisibility : prev
    })
  }, [
    autoHideEmptyColumns,
    columnsWithData,
    columns,
    data.length,
    isLoading,
    initialColumnVisibility,
  ])

  const table = useReactTable({
    data,
    columns,
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // If parent provided sorting handler, treat sorting as manual (server-side)
    onSortingChange: externalOnSortingChange ?? setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: onPaginationChange,
    state: {
      sorting: externalSorting ?? sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pagination?.page ? pagination.page - 1 : 0,
        pageSize: pagination?.limit || 10,
      },
      globalFilter,
    },
    // Server-side pagination için
    manualPagination: !!onPaginationChange,
    // Server-side sorting (if parent handles sorting)
    manualSorting: !!externalOnSortingChange,
    // Disable sorting removal - only toggle between asc/desc
    enableSortingRemoval: false,
    // pageCount sadece server-side pagination'da gerekli
    ...(onPaginationChange && { pageCount: pagination?.totalPages ?? -1 }),
    // Global filter için
    onGlobalFilterChange,
    manualFiltering: !!onGlobalFilterChange || !!externalOnColumnFiltersChange,
  })

  const toolbarFiltersContent = toolbarFilters ?? filterPanel

  const getColumnFilterValue = (columnId: string) => {
    const entry = columnFilters.find((filter) => filter.id === columnId)
    return typeof entry?.value === 'string' ? entry.value : ''
  }

  const setColumnFilterValue = (columnId: string, value: string) => {
    setColumnFilters((prev) => {
      const next = prev.filter((filter) => filter.id !== columnId)
      if (value.trim()) {
        next.push({ id: columnId, value })
      }
      return next
    })
  }

  const handleSearch = (value: string) => {
    if (onGlobalFilterChange) {
      onGlobalFilterChange(value)
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value)
    }
  }

  const getColumnLabel = (column: Column<TData, unknown>) => {
    const meta = getDataTableColumnMeta(column)

    if (meta?.columnLabel) {
      return meta.columnLabel
    }

    const headerContent = column.columnDef.header

    if (typeof headerContent === 'string') {
      return headerContent
    }

    const staticHeader: React.ReactNode | undefined =
      typeof headerContent === 'function'
        ? undefined
        : (headerContent as React.ReactNode)

    if (staticHeader && isValidElement(staticHeader)) {
      const headerElement = staticHeader as React.ReactElement<{
        children?: React.ReactNode
      }>
      const textContent = Children.toArray(headerElement.props?.children)
        .filter((child): child is string => typeof child === 'string')
        .join(' ')
        .trim()

      if (textContent) {
        return textContent
      }
    }

    return column.id
  }

  const columnMenuProps = {
    table,
    hideColumnsButton,
    autoHideEmptyColumns,
    columnsWithData,
    isLoading,
    dataLength: data.length,
    getColumnLabel,
  }

  const showColumnFilterRow =
    enableColumnFilters &&
    table.getVisibleLeafColumns().some((column) => {
      const meta = getDataTableColumnMeta(column)
      if (meta?.disableColumnFilter) return false
      return !isNonFilterableColumnId(column.id)
    })

  const renderSearchInput = (className?: string) => (
    <div
      className={cn(
        'relative flex w-full min-w-0 max-w-md shrink-0 items-center sm:w-72',
        className
      )}
    >
      <Search className="absolute left-2 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={searchPlaceholder}
        value={
          globalFilter ??
          (searchKey
            ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
            : '')
        }
        onChange={(event) => handleSearch(event.target.value)}
        className="h-10 w-full min-w-0 py-2 pl-8 text-sm sm:text-base"
      />
    </div>
  )

  const renderToolbarActions = (options?: {
    includeLegacyToolbar?: boolean
  }) => (
    <>
      {toolbarAdd ? (
        <div className="flex shrink-0 items-center">{toolbarAdd}</div>
      ) : null}
      {toolbarFiltersContent ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {toolbarFiltersContent}
        </div>
      ) : null}
      {options?.includeLegacyToolbar && toolbar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {toolbar}
        </div>
      ) : null}
    </>
  )

  const defaultTableBody = (
    <>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            {table.getVisibleLeafColumns().map((column) => {
              const isActions = column.id === ACTIONS_COLUMN_ID
              const meta = getDataTableColumnMeta(column)
              return (
                <TableCell
                  key={column.id}
                  className={cn(
                    isActions ? 'text-center' : undefined,
                    meta?.cellClassName
                  )}
                >
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </TableCell>
              )
            })}
          </TableRow>
        ))
      ) : data.length ? (
        table.getRowModel().rows.map((row) => {
          const rowClassName = getRowClassName?.(row.original)
          const baseClassName = onRowClick ? 'cursor-pointer' : undefined
          const combinedClassName =
            [baseClassName, rowClassName].filter(Boolean).join(' ') || undefined

          return (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => onRowClick?.(row.original)}
              className={combinedClassName}
            >
              {row.getVisibleCells().map((cell) => {
                const isActions = cell.column.id === ACTIONS_COLUMN_ID
                const meta = getDataTableColumnMeta(cell.column)
                const renderedCell = flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )

                return (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      isActions ? 'text-right' : undefined,
                      meta?.cellClassName
                    )}
                  >
                    {normalizeCellNode(renderedCell)}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })
      ) : (
        <TableRow>
          <TableCell
            colSpan={table.getVisibleLeafColumns().length}
            className="h-24 text-center"
          >
            Veri bulunamadı.
          </TableCell>
        </TableRow>
      )}
    </>
  )

  return (
    <div className="min-w-0 w-full space-y-4">
      {/* Toolbar */}
      <div className="flex min-w-0 flex-col gap-2">
        {/* Desktop: arama → ekle → filtreler → (legacy toolbar) → sütunlar (sağ) */}
        <div className="hidden w-full items-center gap-2 sm:flex">
          {renderSearchInput()}
          {renderToolbarActions({ includeLegacyToolbar: true })}
          <div className="ml-auto flex shrink-0 items-center">
            <ColumnVisibilityMenu {...columnMenuProps} />
          </div>
        </div>

        {/* Mobil */}
        {mobileSearchFullRow ? (
          <div className="flex w-full flex-col gap-2 sm:hidden">
            {renderSearchInput()}
            <div className="flex flex-wrap items-center gap-2">
              {renderToolbarActions({ includeLegacyToolbar: true })}
              <div className="ml-auto flex shrink-0 items-center">
                <ColumnVisibilityMenu {...columnMenuProps} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:hidden">
            <div className="flex items-center gap-2">
              {renderSearchInput('min-w-0 flex-1 max-w-none sm:max-w-md')}
              {toolbarAdd ? (
                <div className="flex shrink-0 items-center">{toolbarAdd}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {toolbarFiltersContent ? (
                <div className="flex flex-wrap items-center gap-2">
                  {toolbarFiltersContent}
                </div>
              ) : null}
              {toolbar ? (
                <div className="flex flex-wrap items-center gap-2">
                  {toolbar}
                </div>
              ) : null}
              <div className="ml-auto flex shrink-0 items-center">
                <ColumnVisibilityMenu {...columnMenuProps} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tablo — DndContext wraps <table>, not <tbody> (a11y hidden nodes are divs) */}
      <div
        className={cn(
          'w-full min-w-0 rounded-md border',
          fitContainer ? 'overflow-x-hidden' : 'overflow-x-auto'
        )}
      >
        {(() => {
          const tableNode = (
            <Table
              containerClassName={
                fitContainer ? 'overflow-x-hidden' : undefined
              }
              className={cn(
                fitContainer
                  ? 'w-full table-fixed [&_[data-slot=table-head]]:whitespace-normal [&_[data-slot=table-cell]]:whitespace-normal'
                  : 'min-w-max',
                tableMinWidth
              )}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isActions = header.column.id === ACTIONS_COLUMN_ID
                      const meta = getDataTableColumnMeta(header.column)
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            isActions ? 'text-right' : undefined,
                            meta?.headerClassName
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : (() => {
                                const canSort = header.column.getCanSort?.()
                                const sortState = header.column.getIsSorted?.()
                                if (canSort) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={header.column.getToggleSortingHandler?.()}
                                      className="flex items-center gap-2"
                                    >
                                      {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                      )}
                                      <span className="text-muted-foreground text-sm">
                                        {sortState === 'asc'
                                          ? '▲'
                                          : sortState === 'desc'
                                            ? '▼'
                                            : ''}
                                      </span>
                                    </button>
                                  )
                                }

                                return flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )
                              })()}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
                {showColumnFilterRow ? (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    {table.getVisibleLeafColumns().map((column) => {
                      const meta = getDataTableColumnMeta(column)
                      const filterDisabled =
                        meta?.disableColumnFilter ||
                        isNonFilterableColumnId(column.id)

                      if (filterDisabled) {
                        return (
                          <TableHead
                            key={`filter-${column.id}`}
                            className="p-2"
                          />
                        )
                      }

                      const label = getColumnLabel(column)
                      const filterSelectOptions = meta?.filterSelectOptions
                      return (
                        <TableHead key={`filter-${column.id}`} className="p-2">
                          {filterSelectOptions ? (
                            <Select
                              value={
                                getColumnFilterValue(column.id) || '__all__'
                              }
                              onValueChange={(value) =>
                                setColumnFilterValue(
                                  column.id,
                                  value === '__all__' ? '' : value
                                )
                              }
                            >
                              <SelectTrigger
                                className="h-8 w-full text-xs"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <SelectValue
                                  placeholder={
                                    meta?.filterPlaceholder ?? `${label} seç...`
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {filterSelectOptions.map((option) => (
                                  <SelectItem
                                    key={option.value || '__all__'}
                                    value={option.value || '__all__'}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={getColumnFilterValue(column.id)}
                              onChange={(event) =>
                                setColumnFilterValue(
                                  column.id,
                                  event.target.value
                                )
                              }
                              placeholder={
                                meta?.filterPlaceholder ?? `${label} ara...`
                              }
                              className="h-8 text-xs"
                              onClick={(event) => event.stopPropagation()}
                            />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ) : null}
              </TableHeader>
              <TableBody>
                {isLoading || !renderTableBody
                  ? defaultTableBody
                  : renderTableBody(table)}
              </TableBody>
            </Table>
          )

          if (!tableDnd) {
            return tableNode
          }

          return (
            <DataTableDnd
              items={tableDnd.items}
              strategy={tableDnd.strategy}
              onDragEnd={tableDnd.onDragEnd}
              disabled={tableDnd.disabled}
              activationDistance={tableDnd.activationDistance}
            >
              {tableNode}
            </DataTableDnd>
          )
        })()}
      </div>

      {/* Pagination */}
      <div
        className={cn(
          'flex flex-col gap-2 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2',
          paginationAlign === 'end' ? 'sm:justify-end' : 'sm:justify-between'
        )}
      >
        {paginationAlign === 'between' ? (
          <div className="min-w-0 flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} /{' '}
                {table.getFilteredRowModel().rows.length} satır seçili.
              </span>
            )}
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">
            Sayfa {table.getState().pagination.pageIndex + 1} /{' '}
            {pagination?.totalPages ?? table.getPageCount()}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const currentPageIndex = table.getState().pagination.pageIndex
              const totalPages = pagination?.totalPages ?? table.getPageCount()
              const isFirstPage = currentPageIndex === 0
              const isLastPage = pagination
                ? currentPageIndex >= totalPages - 1
                : !table.getCanNextPage()

              return (
                <>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => {
                      if (onPaginationChange) {
                        onPaginationChange({
                          pageIndex: 0,
                          pageSize: pagination?.limit || 10,
                        })
                      } else {
                        table.setPageIndex(0)
                      }
                    }}
                    disabled={isFirstPage}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (onPaginationChange) {
                        onPaginationChange({
                          pageIndex: currentPageIndex - 1,
                          pageSize: pagination?.limit || 10,
                        })
                      } else {
                        table.previousPage()
                      }
                    }}
                    disabled={isFirstPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (onPaginationChange) {
                        onPaginationChange({
                          pageIndex: currentPageIndex + 1,
                          pageSize: pagination?.limit || 10,
                        })
                      } else {
                        table.nextPage()
                      }
                    }}
                    disabled={isLastPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => {
                      const lastPageIndex = totalPages - 1
                      if (onPaginationChange) {
                        onPaginationChange({
                          pageIndex: lastPageIndex,
                          pageSize: pagination?.limit || 10,
                        })
                      } else {
                        table.setPageIndex(lastPageIndex)
                      }
                    }}
                    disabled={isLastPage}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hızlı sütun oluşturucu yardımcı fonksiyonları
export const createSelectColumn = <TData,>() => ({
  id: 'select',
  header: ({ table }: { table: ReactTable<TData> }) => (
    <input
      type="checkbox"
      checked={table.getIsAllPageRowsSelected()}
      onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
      className="rounded"
    />
  ),
  cell: ({ row }: { row: Row<TData> }) => (
    <input
      type="checkbox"
      checked={row.getIsSelected()}
      onChange={(e) => row.toggleSelected(!!e.target.checked)}
      className="rounded"
    />
  ),
  enableSorting: false,
  enableHiding: false,
})

export const createActionColumn = <TData,>(
  actions: (row: Row<TData>) => React.ReactNode
) => ({
  id: ACTIONS_COLUMN_ID,
  header: () => 'İşlemler',
  cell: ({ row }: { row: Row<TData> }) => (
    <div className="flex items-center justify-end gap-1">{actions(row)}</div>
  ),
  enableSorting: false,
  enableHiding: false,
  meta: {
    disableColumnFilter: true,
    columnLabel: 'İşlemler',
  },
})

export const createBadgeColumn = (
  accessor: string,
  header: string,
  badgeVariant: (
    value: unknown
  ) => 'default' | 'secondary' | 'destructive' | 'outline' = () => 'default'
) => ({
  accessorKey: accessor,
  header,
  cell: ({ getValue }: { getValue: () => unknown }) => {
    const value = getValue()
    return <Badge variant={badgeVariant(value)}>{value as string}</Badge>
  },
})
