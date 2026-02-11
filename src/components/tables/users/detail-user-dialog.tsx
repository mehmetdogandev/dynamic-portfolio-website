"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailUserDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailUserDialog({
  userId,
  open,
  onOpenChange,
}: DetailUserDialogProps) {
  const { data: user, isLoading } = api.user.getById.useQuery(
    { id: userId },
    { enabled: open && !!userId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayı</DialogTitle>
          <DialogDescription>
            Kullanıcı bilgileri salt okunur.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : user ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad Soyad</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">E-posta</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Kullanıcı bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
