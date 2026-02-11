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
import { Eye, Pencil, Trash2, Star } from "lucide-react";
import { DetailLogosDialog } from "./detail-logos-dialog";
import { UpdateLogosDialog } from "./update-logos-dialog";
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

type Logo = {
  id: string;
  name: string;
  path: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type LogosDataTableProps = {
  logos: Logo[];
  isLoading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function LogosDataTable({
  logos,
  isLoading,
  canRead,
  canUpdate,
  canDelete,
}: LogosDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.logo.delete.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
      setDeleteId(null);
    },
  });
  const setActiveMutation = api.logo.setActive.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
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
            <TableHead>Yol</TableHead>
            <TableHead>Durum</TableHead>
            {(canRead || canUpdate || canDelete) && (
              <TableHead className="w-[140px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logos.map((logo) => (
            <TableRow key={logo.id}>
              <TableCell>{logo.name}</TableCell>
              <TableCell className="max-w-[200px] truncate font-mono text-xs">{logo.path}</TableCell>
              <TableCell>{logo.status}</TableCell>
              {(canRead || canUpdate || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(logo.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpdate && logo.status !== "ACTIVE" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setActiveMutation.mutate({ id: logo.id })}
                        aria-label="Aktif yap"
                        disabled={setActiveMutation.isPending}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUpdateId(logo.id)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(logo.id)}
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
        <DetailLogosDialog
          logoId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdateLogosDialog
          logoId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logoyu sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Logoyu silmek istediğinize emin misiniz?
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
