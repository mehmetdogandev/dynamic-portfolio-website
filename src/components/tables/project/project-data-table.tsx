"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/trpc/react";
import { DataTableWrapper, createActionColumn } from "@/components/ui/data-table-wrapper";
import { Badge } from "@/components/ui/badge";

type ProjectListItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  categoryId: string;
  categoryName: string | null;
  isPublished: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export function ProjectDataTable() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.PROJECT?.includes("CREATE") ?? false;
  const canRead = permissions?.PROJECT?.includes("READ") ?? false;
  const canUpdate = permissions?.PROJECT?.includes("UPDATE") ?? false;
  const canDelete = permissions?.PROJECT?.includes("DELETE") ?? false;

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading } = api.project.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy,
    sortOrder: sortBy ? sortOrder : undefined,
    columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
  });

  const router = useRouter();
  const utils = api.useUtils();
  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      void utils.project.list.invalidate();
      router.refresh();
      setDeleteId(null);
    },
  });

  const columns = useMemo<ColumnDef<ProjectListItem>[]>(() => {
    const cols: ColumnDef<ProjectListItem>[] = [
      {
        accessorKey: "name",
        header: "Ad",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Ad",
        },
      },
      {
        accessorKey: "slug",
        header: "Slug",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Slug",
        },
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "categoryName",
        header: "Kategori",
        meta: {
          columnLabel: "Kategori",
        },
      },
      {
        accessorKey: "shortDescription",
        header: "Kısa Açıklama",
        meta: {
          columnLabel: "Kısa Açıklama",
        },
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return value ? (
            <div className="max-w-[200px] truncate">{value}</div>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "isPublished",
        header: "Yayında",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Yayında",
        },
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? "default" : "secondary"}>
            {getValue() ? "Evet" : "Hayır"}
          </Badge>
        ),
      },
      {
        accessorKey: "order",
        header: "Sıra",
        enableSorting: true,
        meta: {
          columnLabel: "Sıra",
        },
      },
    ];

    if (canRead || canUpdate || canDelete) {
      cols.push(
        createActionColumn<ProjectListItem>((row) => (
          <div className="flex items-center justify-center gap-2">
            {canRead && (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/admin-panel/projects/${row.original.id}`} aria-label="Detay">
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canUpdate && (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/admin-panel/projects/${row.original.id}/edit`} aria-label="Düzenle">
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(row.original.id)}
                aria-label="Sil"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))
      );
    }

    return cols;
  }, [canRead, canUpdate, canDelete]);

  const toolbar = canCreate ? (
    <Button asChild>
      <Link href="/admin-panel/projects/new">
        <Plus className="mr-2 h-4 w-4" />
        Yeni Proje
      </Link>
    </Button>
  ) : undefined;

  const handlePaginationChange = (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
    setPagination((old) => {
      const newPagination = typeof updater === "function" ? updater(old) : updater;
      return newPagination;
    });
  };

  return (
    <>
      <DataTableWrapper
        columns={columns}
        data={data?.items ?? []}
        pagination={
          data
            ? {
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                total: data.total,
                totalPages: data.totalPages,
              }
            : undefined
        }
        onPaginationChange={handlePaginationChange}
        sorting={sorting}
        onSortingChange={setSorting}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        isLoading={isLoading}
        toolbar={toolbar}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projeyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Projeyi silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
