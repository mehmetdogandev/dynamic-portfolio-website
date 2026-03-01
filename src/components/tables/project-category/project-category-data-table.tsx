"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { DetailProjectCategoryDialog } from "./detail-project-category-dialog";
import { UpdateProjectCategoryDialog } from "./update-project-category-dialog";
import { CreateProjectCategoryDialog } from "./create-project-category-dialog";
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

type ProjectCategory = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

export function ProjectCategoryDataTable() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.PROJECT_CATEGORY?.includes("CREATE") ?? false;
  const canRead = permissions?.PROJECT_CATEGORY?.includes("READ") ?? false;
  const canUpdate = permissions?.PROJECT_CATEGORY?.includes("UPDATE") ?? false;
  const canDelete = permissions?.PROJECT_CATEGORY?.includes("DELETE") ?? false;

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, isLoading } = api.projectCategory.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy,
    sortOrder: sortBy ? sortOrder : undefined,
    columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
  });

  const router = useRouter();
  const utils = api.useUtils();
  const deleteMutation = api.projectCategory.delete.useMutation({
    onSuccess: () => {
      void utils.projectCategory.list.invalidate();
      router.refresh();
      setDeleteId(null);
    },
  });

  const columns = useMemo<ColumnDef<ProjectCategory>[]>(() => {
    const cols: ColumnDef<ProjectCategory>[] = [
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
        accessorKey: "description",
        header: "Açıklama",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Açıklama",
        },
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return <div className="max-w-[200px] truncate">{value}</div>;
        },
      },
    ];

    if (canRead || canUpdate || canDelete) {
      cols.push(
        createActionColumn<ProjectCategory>((row) => (
          <div className="flex items-center justify-center gap-2">
            {canRead && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDetailId(row.original.id)}
                aria-label="Detay"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUpdateId(row.original.id)}
                aria-label="Düzenle"
              >
                <Pencil className="h-4 w-4" />
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
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Yeni Kategori
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
      {detailId && (
        <DetailProjectCategoryDialog
          categoryId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdateProjectCategoryDialog
          categoryId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <CreateProjectCategoryDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Proje kategorisini sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. İlişkili projeler varsa silinemez veya onlar da etkilenebilir. Silmek istediğinize emin misiniz?
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
