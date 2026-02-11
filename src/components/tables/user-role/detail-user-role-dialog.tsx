"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailUserRoleDialogProps = {
  userRoleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailUserRoleDialog({ userRoleId, open, onOpenChange }: DetailUserRoleDialogProps) {
  const { data: userRole, isLoading } = api.userRole.getById.useQuery(
    { id: userRoleId },
    { enabled: open && !!userRoleId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı rolü detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : userRole ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Kullanıcı</dt>
              <dd>{userRole.userName}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Rol</dt>
              <dd>{userRole.roleName}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Kayıt bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
