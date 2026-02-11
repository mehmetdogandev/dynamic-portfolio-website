"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailRoleDialogProps = {
  roleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailRoleDialog({ roleId, open, onOpenChange }: DetailRoleDialogProps) {
  const { data: role, isLoading } = api.role.getById.useQuery({ id: roleId }, { enabled: open && !!roleId });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rol detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : role ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad</dt>
              <dd>{role.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Açıklama</dt>
              <dd>{role.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Sayfa</dt>
              <dd>{role.page}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Yetkiler</dt>
              <dd>{Array.isArray(role.permissions) ? (role.permissions as string[]).join(", ") : "-"}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Rol bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
