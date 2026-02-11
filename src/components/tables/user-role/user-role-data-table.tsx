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
import { Eye, Trash2 } from "lucide-react";
import { DetailUserRoleDialog } from "./detail-user-role-dialog";
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

type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  roleName: string;
};

type UserRoleDataTableProps = {
  userRoles: UserRole[];
  isLoading: boolean;
  canRead: boolean;
  canDelete: boolean;
};

export function UserRoleDataTable({
  userRoles,
  isLoading,
  canRead,
  canDelete,
}: UserRoleDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.userRole.delete.useMutation({
    onSuccess: () => {
      void utils.userRole.list.invalidate();
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
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Rol</TableHead>
            {(canRead || canDelete) && (
              <TableHead className="w-[120px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {userRoles.map((ur) => (
            <TableRow key={ur.id}>
              <TableCell>{ur.userName}</TableCell>
              <TableCell>{ur.roleName}</TableCell>
              {(canRead || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(ur.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(ur.id)}
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
        <DetailUserRoleDialog
          userRoleId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
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
