"use client";

import { useMemo } from "react";
import type { ColumnDef, PaginationState, SortingState, OnChangeFn } from "@tanstack/react-table";
import { DataTable, createSelectColumn, createActionColumn, createBadgeColumn } from "@/components/ui/data-table";

export interface DataTableWrapperProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	searchKey?: string;
	searchPlaceholder?: string;
	pageCount?: number;
	pagination?: {
		totalPages: number;
		total: number;
		page: number;
		limit: number;
	};
	onPaginationChange?: (
		pagination:
			| PaginationState
			| ((old: PaginationState) => PaginationState)
	) => void;
	globalFilter?: string;
	onGlobalFilterChange?: (filter: string) => void;
	columnFilters?: Record<string, string>;
	onColumnFiltersChange?: (filters: Record<string, string>) => void;
	isLoading?: boolean;
	toolbar?: React.ReactNode;
	sorting?: SortingState;
	onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTableWrapper<TData, TValue>({
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
	isLoading = false,
	toolbar,
	sorting,
	onSortingChange,
}: DataTableWrapperProps<TData, TValue>) {
	// Pass toolbar as-is, DataTable handles the layout
	const combinedToolbar = useMemo(() => {
		if (!toolbar) return undefined;
		return toolbar;
	}, [toolbar]);

	return (
		<DataTable
			columns={columns}
			data={data}
			searchKey={searchKey}
			searchPlaceholder={searchPlaceholder}
			pagination={pagination}
			onPaginationChange={onPaginationChange}
			globalFilter={globalFilter}
			onGlobalFilterChange={onGlobalFilterChange}
			columnFilters={columnFilters}
			onColumnFiltersChange={onColumnFiltersChange}
			sorting={sorting}
			onSortingChange={onSortingChange}
			isLoading={isLoading}
			toolbar={combinedToolbar}
		/>
	);
}

// Re-export helper functions
export { createSelectColumn, createActionColumn, createBadgeColumn };
