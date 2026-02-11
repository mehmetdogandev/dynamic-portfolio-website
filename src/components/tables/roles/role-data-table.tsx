"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { DetailRoleDialog } from "./detail-role-dialog";
import { UpdateRoleDialog } from "./update-role-dialog";
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

type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  page: string;
  createdAt: Date;
  updatedAt: Date;
};

type RoleDataTableProps = {
  roles: Role[];
  isLoading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function RoleDataTable({
  roles,
  isLoading,
  canRead,
  canUpdate,
  canDelete,
}: RoleDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.role.delete.useMutation({
    onSuccess: () => {
      void utils.role.list.invalidate();
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ad</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Sayfa</TableHead>
            {(canRead || canUpdate || canDelete) && (
              <TableHead className="w-[120px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{role.description}</TableCell>
              <TableCell>{role.page}</TableCell>
              {(canRead || canUpdate || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(role.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUpdateId(role.id)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(role.id)}
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {detailId && (
        <DetailRoleDialog
          roleId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdateRoleDialog
          roleId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rolü sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Rolü silmek istediğinize emin misiniz?
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
