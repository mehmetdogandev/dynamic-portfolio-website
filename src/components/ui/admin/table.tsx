import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  type TableProps,
} from "@/components/ui/table"
import { AdminButton } from "@/components/ui/admin/button"
import { cn } from "@/lib/utils"

export interface AdminTableColumn<T = any> {
  key: string
  header: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  className?: string
}

export interface AdminTableProps<T = any> extends TableProps {
  columns: AdminTableColumn<T>[]
  data: T[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onView?: (row: T) => void
  emptyMessage?: string
  showActions?: boolean
}

function AdminTable<T extends Record<string, any>>({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  emptyMessage = "No data available",
  showActions = true,
  className,
  ...props
}: AdminTableProps<T>) {
  const hasActions = showActions && (onEdit || onDelete || onView)

  return (
    <div className="rounded-md border">
      <Table className={cn("", className)} {...props}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <AdminButton
                          variant="view"
                          size="icon"
                          onClick={() => onView(row)}
                        />
                      )}
                      {onEdit && (
                        <AdminButton
                          variant="edit"
                          size="icon"
                          onClick={() => onEdit(row)}
                        />
                      )}
                      {onDelete && (
                        <AdminButton
                          variant="delete"
                          size="icon"
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

AdminTable.displayName = "AdminTable"

export { AdminTable }
