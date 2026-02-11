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
import { DetailUserRoleGroupDialog } from "./detail-user-role-group-dialog";
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

type UserRoleGroup = {
  id: string;
  userId: string;
  roleGroupId: string;
  createdAt: Date;
  updatedAt: Date;
};

type UserRoleGroupDataTableProps = {
  userRoleGroups: UserRoleGroup[];
  isLoading: boolean;
  canRead: boolean;
  canDelete: boolean;
};

export function UserRoleGroupDataTable({
  userRoleGroups,
  isLoading,
  canRead,
  canDelete,
}: UserRoleGroupDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.userRoleGroup.delete.useMutation({
    onSuccess: () => {
      void utils.userRoleGroup.list.invalidate();
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
            <TableHead>Kullanıcı ID</TableHead>
            <TableHead>Rol Grubu ID</TableHead>
            {(canRead || canDelete) && (
              <TableHead className="w-[120px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {userRoleGroups.map((urg) => (
            <TableRow key={urg.id}>
              <TableCell className="font-mono text-xs">{urg.userId}</TableCell>
              <TableCell className="font-mono text-xs">{urg.roleGroupId}</TableCell>
              {(canRead || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(urg.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(urg.id)}
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
        <DetailUserRoleGroupDialog
          userRoleGroupId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kullanıcı rol grubunu kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Kullanıcıdan bu rol grubunu kaldırmak istediğinize emin misiniz?
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
