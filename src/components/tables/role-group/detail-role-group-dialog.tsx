"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailRoleGroupDialogProps = {
  roleGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailRoleGroupDialog({ roleGroupId, open, onOpenChange }: DetailRoleGroupDialogProps) {
  const { data: roleGroup, isLoading } = api.roleGroup.getById.useQuery(
    { id: roleGroupId },
    { enabled: open && !!roleGroupId }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rol grubu detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : roleGroup ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad</dt>
              <dd>{roleGroup.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Açıklama</dt>
              <dd>{roleGroup.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Rol ID</dt>
              <dd className="font-mono text-xs">{roleGroup.roleId}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Rol grubu bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
