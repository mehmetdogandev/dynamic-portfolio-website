"use client";

import { useState, useMemo } from "react";
import type { ColumnDef, SortingState, PaginationState, Row } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { DetailUserDialog } from "./detail-user-dialog";
import { UpdateUserDialog } from "./update-user-dialog";
import { CreateUserDialog } from "./create-user-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/lib/trpc/react";
import { DataTableWrapper, createActionColumn } from "@/components/ui/data-table-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  profilePicture?: string | null;
  displayName?: string | null;
};

export function UserDataTable() {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
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
  const canCreate = permissions?.USERS?.includes("CREATE") ?? false;
  const canRead = permissions?.USERS?.includes("READ") ?? false;
  const canUpdate = permissions?.USERS?.includes("UPDATE") ?? false;
  const canDelete = permissions?.USERS?.includes("DELETE") ?? false;

  // Convert sorting state to backend format
  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Fetch data with pagination, sorting, filtering
  const { data, isLoading } = api.user.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: sortBy as string | undefined,
    sortOrder: sortBy ? (sortOrder as "asc" | "desc") : undefined,
    columnFilters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
  });

  const utils = api.useUtils();
  const deleteMutation = api.user.delete.useMutation({
    onSuccess: () => {
      void utils.user.list.invalidate();
      setDeleteId(null);
    },
  });

  // Define columns
  const columns = useMemo<ColumnDef<User>[]>(() => {
    const cols: ColumnDef<User>[] = [
      {
        id: "profile",
        header: "Profil",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          const u = row.original;
          const src = u.profilePicture ?? u.image ?? null;
          const label = (u.displayName ?? u.name ?? "?").trim();
          const initial = label ? label.charAt(0).toUpperCase() : "?";
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {src ? (
                  <AvatarImage src={src} alt={label} />
                ) : null}
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <span className="truncate">{label || "—"}</span>
            </div>
          );
        },
        meta: { columnLabel: "Profil" },
      },
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
        accessorKey: "email",
        header: "E-posta",
        enableSorting: true,
        enableColumnFilter: true,
        meta: {
          columnLabel: "E-posta",
        },
      },
    ];

    // Add actions column if user has any permission
    if (canRead || canUpdate || canDelete) {
      cols.push(
        createActionColumn<User>((row: Row<User>) => (
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

  // Toolbar with create button
  const toolbar = canCreate ? (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Yeni Kullanıcı
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
        <DetailUserDialog
          userId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdateUserDialog
          userId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcıyı sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kullanıcıyı silmek istediğinize emin misiniz?
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
