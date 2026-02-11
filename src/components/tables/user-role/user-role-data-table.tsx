"use client";

import { useState, useMemo } from "react";
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Plus } from "lucide-react";
import { DetailUserRoleDialog } from "./detail-user-role-dialog";
import { CreateUserRoleDialog } from "./create-user-role-dialog";
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

type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  roleName: string;
};

export function UserRoleDataTable() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  
  // Pagination, sorting, filtering state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Get permissions
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.USER_ROLES?.includes("CREATE") ?? false;
  const canRead = permissions?.USER_ROLES?.includes("READ") ?? false;
  const canDelete = permissions?.USER_ROLES?.includes("DELETE") ?? false;

  // Convert sorting state to backend format
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch data with pagination, sorting, filtering
  const { data, isLoading } = api.userRole.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sortBy as string | undefined,
    sortOrder: sortBy ? (sortOrder as "asc" | "desc") : undefined,
    columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
  });

  const utils = api.useUtils();
  const deleteMutation = api.userRole.delete.useMutation({
    onSuccess: () => {
      void utils.userRole.list.invalidate();
      setDeleteId(null);
    },
  });

  // Define columns
  const columns = useMemo<ColumnDef<UserRole>[]>(() => {
    const cols: ColumnDef<UserRole>[] = [
      {
        accessorKey: "userName",
        header: "Kullanıcı",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Kullanıcı",
        },
      },
      {
        accessorKey: "roleName",
        header: "Rol",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "Rol",
        },
      },
    ];

    // Add actions column if user has any permission
    if (canRead || canDelete) {
      cols.push(
        createActionColumn<UserRole>((row) => (
          <div className="flex items-center gap-2 justify-center">
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
  }, [canRead, canDelete]);

  // Toolbar with create button
  const toolbar = canCreate ? (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Yeni Kullanıcı Rolü
    </Button>
  ) : undefined;

  // Handle pagination change
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
        <DetailUserRoleDialog
          userRoleId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      <CreateUserRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı rolünü kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kullanıcıdan bu rolü kaldırmak istediğinize emin misiniz?
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
