"use client";

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
    type Row,
    type Column,
    type Table as ReactTable,
} from "@tanstack/react-table";
import React, { useState, useMemo, useEffect, useRef, useCallback, Children, isValidElement } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

// Utility function to detect which columns have data
function getColumnsWithData<TData, TValue = unknown>(
    data: TData[],
    columns: ColumnDef<TData, TValue>[]
): Set<string> {
    const columnsWithData = new Set<string>();

    if (!data.length) {
        return columnsWithData;
    }

    columns.forEach((column) => {
        if ("accessorKey" in column && column.accessorKey) {
            const accessorKey = column.accessorKey as string;

            // Check if any row has meaningful data for this column
            const hasData = data.some((row) => {
                const value = (row as Record<string, unknown>)[accessorKey];

                // Consider data as existing if:
                // - Not null, undefined, or empty string
                // - For arrays: not empty
                // - For objects: not empty object
                if (value === null || value === undefined || value === "") {
                    return false;
                }

                // For arrays, check if they have content
                if (Array.isArray(value)) {
                    return value.length > 0;
                }

                // For objects, check if they have properties
                // Note: Date objects are special - they should always be considered as having data
                if (typeof value === "object") {
                    // Date objects should always be considered as having data
                    if (value instanceof Date) {
                        return true;
                    }
                    return Object.keys(value as Record<string, unknown>).length > 0;
                }

                // For primitive values, consider any non-empty value as data
                return true;
            });

            if (hasData) {
                columnsWithData.add(accessorKey);
            }
        } else if ("id" in column && column.id) {
            // For custom columns (like actions, select, duration), always include them
            // unless they're specifically data-dependent
            if (
                column.id === "select" ||
                column.id === "actions" ||
                column.id === "duration"
            ) {
                columnsWithData.add(column.id);
            }
        }
    });

    return columnsWithData;
}

interface Pagination {
    totalPages: number;
    total: number;
    page: number;
    limit: number;
}
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    // Server-side pagination desteği
    pageCount?: number;
    pagination?: Pagination;
    onPaginationChange?: (
        pagination:
            | PaginationState
            | ((old: PaginationState) => PaginationState)
    ) => void;
    // Server-side filtering desteği
    globalFilter?: string;
    onGlobalFilterChange?: (filter: string) => void;
    // Server-side column filtering desteği
    columnFilters?: Record<string, string>;
    onColumnFiltersChange?: (filters: Record<string, string>) => void;
    // Loading state
    isLoading?: boolean;
    // Ek toolbar bileşenleri
    toolbar?: React.ReactNode;
    // Optional external sorting state (for server-side sorting)
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey: _searchKey,
    searchPlaceholder: _searchPlaceholder = "Ara...",
    pagination,
    onPaginationChange,
    globalFilter,
    onGlobalFilterChange,
    columnFilters: externalColumnFilters,
    onColumnFiltersChange,
    isLoading = false,
    toolbar,
    sorting: externalSorting,
    onSortingChange: externalOnSortingChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const hasServerColumnFilters = !!onColumnFiltersChange;
    const [localFilterValues, setLocalFilterValues] = useState<Record<string, string>>(externalColumnFilters ?? {});
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        setLocalFilterValues(externalColumnFilters ?? {});
    }, [externalColumnFilters]);
    const commitColumnFilters = useCallback(
        (next: Record<string, string>) => {
            onColumnFiltersChange?.(next);
        },
        [onColumnFiltersChange]
    );
    const handleFilterChange = useCallback(
        (columnId: string, value: string) => {
            setLocalFilterValues((prev) => {
                const next = { ...prev, [columnId]: value };
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => commitColumnFilters(next), 350);
                return next;
            });
        },
        [commitColumnFilters]
    );
    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // Automatically determine which columns have data and hide empty ones
    const columnsWithData = useMemo(() => {
        const result = getColumnsWithData(data, columns);

        // If no data but columns exist, show all columns by default
        if (data.length === 0) {
            const allColumns = new Set<string>();
            columns.forEach((column) => {
                if ("accessorKey" in column && column.accessorKey) {
                    allColumns.add(column.accessorKey as string);
                } else if ("id" in column && column.id) {
                    allColumns.add(column.id);
                }
            });
            return allColumns;
        }

        return result;
    }, [data, columns]);

    // Initialize column visibility - start with all columns visible
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );

    // Update column visibility: when server-side column filters, keep all columns visible; else hide empty
    useEffect(() => {
        const newVisibility: VisibilityState = {};

        columns.forEach((column) => {
            if ("accessorKey" in column && column.accessorKey) {
                const accessorKey = column.accessorKey as string;
                newVisibility[accessorKey] = hasServerColumnFilters
                    ? true
                    : isLoading || data.length === 0 || columnsWithData.has(accessorKey);
            } else if ("id" in column && column.id) {
                newVisibility[column.id] = hasServerColumnFilters
                    ? true
                    : isLoading || data.length === 0 || columnsWithData.has(column.id);
            }
        });

        setColumnVisibility((prev) => {
            const hasChanged = Object.keys(newVisibility).some(
                (key) => prev[key] !== newVisibility[key]
            ) || Object.keys(prev).length !== Object.keys(newVisibility).length;
            return hasChanged ? newVisibility : prev;
        });
    }, [columnsWithData, columns, data.length, isLoading, hasServerColumnFilters]);

    const table = useReactTable({
        data,
        columns,
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
                pageSize: pagination?.limit ?? 10,
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
        manualFiltering: !!onGlobalFilterChange,
    });


    const getColumnLabel = (column: Column<TData, unknown>) => {
        const meta = column.columnDef.meta as
            | {
                columnLabel?: string;
            }
            | undefined;

        if (meta?.columnLabel) {
            return meta.columnLabel;
        }

        const headerContent = column.columnDef.header;

        if (typeof headerContent === "string") {
            return headerContent;
        }

        const staticHeader: React.ReactNode | undefined =
            typeof headerContent === "function"
                ? undefined
                : (headerContent as React.ReactNode);

        if (staticHeader && isValidElement(staticHeader)) {
            const headerElement = staticHeader as React.ReactElement<{
                children?: React.ReactNode;
            }>;
            const textContent = Children.toArray(
                headerElement.props?.children
            )
                .filter((child): child is string => typeof child === "string")
                .join(" ")
                .trim();

            if (textContent) {
                return textContent;
            }
        }

        return column.id;
    };


    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {toolbar && (
                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                        {toolbar}
                    </div>
                </div>
            )}

            {/* Tablo */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {/* Header Row */}
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isActions =
                                        header.column.id === "actions";
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={
                                                isActions
                                                    ? "!text-center w-[1%] whitespace-nowrap"
                                                    : undefined
                                            }
                                        >
                                            {header.isPlaceholder ? null : (() => {
                                                const canSort = header.column.getCanSort?.();
                                                const sortState = header.column.getIsSorted?.();
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
                                                                {sortState === "asc" ? "▲" : sortState === "desc" ? "▼" : ""}
                                                            </span>
                                                        </button>
                                                    );
                                                }

                                                return flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                );
                                            })()}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                        {/* Filter row: one search input per filterable column (server-side) */}
                        {hasServerColumnFilters && (
                            <TableRow>
                                {table.getVisibleLeafColumns().map((column) => {
                                    const isActions = column.id === "actions";
                                    const enableFilter = (column.columnDef as { enableColumnFilter?: boolean }).enableColumnFilter;
                                    return (
                                        <TableCell
                                            key={column.id}
                                            className={
                                                isActions
                                                    ? "!text-center w-[1%] whitespace-nowrap"
                                                    : undefined
                                            }
                                        >
                                            {enableFilter ? (
                                                <Input
                                                    placeholder="Ara..."
                                                    value={localFilterValues[column.id] ?? ""}
                                                    onChange={(e) => handleFilterChange(column.id, e.target.value)}
                                                    className="h-8"
                                                />
                                            ) : null}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            // Loading state - only show skeletons for visible columns
                            Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    {table
                                        .getVisibleLeafColumns()
                                        .map((column) => {
                                            const isActions = column.id === "actions";
                                            return (
                                                <TableCell
                                                    key={column.id}
                                                    className={
                                                        isActions
                                                            ? "text-center"
                                                            : undefined
                                                    }
                                                >
                                                    <div className="h-4 bg-muted animate-pulse rounded" />
                                                </TableCell>
                                            );
                                        })}
                                </TableRow>
                            ))
                        ) : data.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isActions = cell.column.id === "actions";
                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={
                                                    isActions
                                                        ? "text-center"
                                                        : undefined
                                                }
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        table.getVisibleLeafColumns().length
                                    }
                                    className="h-24 text-center"
                                >
                                    Veri bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                        <span>
                            {table.getFilteredSelectedRowModel().rows.length} /{" "}
                            {table.getFilteredRowModel().rows.length} satır
                            seçili.
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">
                        Sayfa {table.getState().pagination.pageIndex + 1} /{" "}
                        {table.getPageCount()}
                    </p>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex bg-black text-white dark:bg-white dark:text-black"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 bg-black text-white dark:bg-white dark:text-black"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 bg-black text-white dark:bg-white dark:text-black"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex bg-black text-white dark:bg-white dark:text-black"
                            onClick={() =>
                                table.setPageIndex(table.getPageCount() - 1)
                            }
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Hızlı sütun oluşturucu yardımcı fonksiyonları
export const createSelectColumn = <TData,>() => ({
    id: "select",
    header: ({ table }: { table: ReactTable<TData> }) => (
        <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) =>
                table.toggleAllPageRowsSelected(!!e.target.checked)
            }
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
});

export const createActionColumn = <TData,>(
    actions: (row: Row<TData>) => React.ReactNode
) => ({
    id: "actions",
    header: "İşlemler",
    cell: ({ row }: { row: Row<TData> }) => actions(row),
    enableSorting: false,
    enableHiding: false,
});

export const createBadgeColumn = (
    accessor: string,
    header: string,
    badgeVariant: (
        value: unknown
    ) => "default" | "secondary" | "destructive" | "outline" = () => "default"
) => ({
    accessorKey: accessor,
    header,
    cell: ({ getValue }: { getValue: () => unknown }) => {
        const value = getValue();
        return <Badge variant={badgeVariant(value)}>{value as string}</Badge>;
    },
});
