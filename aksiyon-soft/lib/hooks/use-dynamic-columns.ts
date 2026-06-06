import { useMemo } from 'react'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'

export interface DynamicColumnConfig<TData> {
  columns: ColumnDef<TData>[]
}

/**
 * Returns columns as-is (no column-level permission filtering).
 */
export function useDynamicColumns<TData>({
  columns,
}: DynamicColumnConfig<TData>) {
  const visibleColumns = columns
  const columnVisibility: VisibilityState = useMemo(() => ({}), [])
  const readonlyColumns = useMemo(() => new Set<string>(), [])

  const isColumnReadonly = (_columnKey: string): boolean => false

  const isColumnVisible = (_columnKey: string): boolean => true

  const isColumnEditable = (_columnKey: string): boolean => true

  const visibleColumnKeys = useMemo(() => {
    return visibleColumns
      .map((col) => {
        const columnKey =
          (col as unknown as { accessorKey?: string }).accessorKey || col.id
        return columnKey
      })
      .filter(Boolean) as string[]
  }, [visibleColumns])

  const editableColumnKeys = useMemo(
    () => visibleColumnKeys,
    [visibleColumnKeys]
  )

  return {
    visibleColumns,
    columnVisibility,
    readonlyColumns,
    isColumnReadonly,
    isColumnVisible,
    isColumnEditable,
    visibleColumnKeys,
    editableColumnKeys,
  }
}
