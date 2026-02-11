"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailUserRoleGroupDialogProps = {
  userRoleGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailUserRoleGroupDialog({ userRoleGroupId, open, onOpenChange }: DetailUserRoleGroupDialogProps) {
  const { data: userRoleGroup, isLoading } = api.userRoleGroup.getById.useQuery(
    { id: userRoleGroupId },
    { enabled: open && !!userRoleGroupId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı rol grubu detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : userRoleGroup ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Kullanıcı</dt>
              <dd>{userRoleGroup.userName}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Rol Grubu</dt>
              <dd>{userRoleGroup.roleGroupName}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Kayıt bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
