"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailPostDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailPostDialog({ postId, open, onOpenChange }: DetailPostDialogProps) {
  const { data: post, isLoading } = api.post.getById.useQuery({ id: postId }, { enabled: open && !!postId });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : post ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad</dt>
              <dd>{post.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Kullanıcı ID</dt>
              <dd className="font-mono text-xs">{post.userId}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Post bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
