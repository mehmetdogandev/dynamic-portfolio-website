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
import { DetailRoleGroupDialog } from "./detail-role-group-dialog";
import { UpdateRoleGroupDialog } from "./update-role-group-dialog";
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

type RoleGroup = {
  id: string;
  name: string;
  description: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
};

type RoleGroupDataTableProps = {
  roleGroups: RoleGroup[];
  isLoading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function RoleGroupDataTable({
  roleGroups,
  isLoading,
  canRead,
  canUpdate,
  canDelete,
}: RoleGroupDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.roleGroup.delete.useMutation({
    onSuccess: () => {
      void utils.roleGroup.list.invalidate();
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
            <TableHead>Rol ID</TableHead>
            {(canRead || canUpdate || canDelete) && (
              <TableHead className="w-[120px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roleGroups.map((rg) => (
            <TableRow key={rg.id}>
              <TableCell>{rg.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{rg.description}</TableCell>
              <TableCell className="font-mono text-xs">{rg.roleId}</TableCell>
              {(canRead || canUpdate || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(rg.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUpdateId(rg.id)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(rg.id)}
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
        <DetailRoleGroupDialog
          roleGroupId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdateRoleGroupDialog
          roleGroupId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rol grubunu sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Rol grubunu silmek istediğinize emin misiniz?
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
