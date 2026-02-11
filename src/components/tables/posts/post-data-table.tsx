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
import { DetailPostDialog } from "./detail-post-dialog";
import { UpdatePostDialog } from "./update-post-dialog";
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

type Post = {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PostDataTableProps = {
  posts: Post[];
  isLoading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function PostDataTable({
  posts,
  isLoading,
  canRead,
  canUpdate,
  canDelete,
}: PostDataTableProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const utils = api.useUtils();
  const deleteMutation = api.post.delete.useMutation({
    onSuccess: () => {
      void utils.post.list.invalidate();
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
            <TableHead>Kullanıcı ID</TableHead>
            {(canRead || canUpdate || canDelete) && (
              <TableHead className="w-[120px]">İşlemler</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>{post.name}</TableCell>
              <TableCell className="font-mono text-xs">{post.userId}</TableCell>
              {(canRead || canUpdate || canDelete) && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDetailId(post.id)}
                        aria-label="Detay"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setUpdateId(post.id)}
                        aria-label="Düzenle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(post.id)}
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
        <DetailPostDialog
          postId={detailId}
          open={!!detailId}
          onOpenChange={(open) => !open && setDetailId(null)}
        />
      )}
      {updateId && (
        <UpdatePostDialog
          postId={updateId}
          open={!!updateId}
          onOpenChange={(open) => !open && setUpdateId(null)}
        />
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Postu sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Postu silmek istediğinize emin misiniz?
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
