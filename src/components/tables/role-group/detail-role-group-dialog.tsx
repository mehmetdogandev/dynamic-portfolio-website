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
  const { data: roles } = api.role.list.useQuery({ page: 1, limit: 100 }, { enabled: open && !!roleGroup?.roleIds?.length });

  const roleIds = roleGroup?.roleIds ?? [];
  const roleNames = roles?.items.filter((r) => roleIds.includes(r.id)).map((r) => r.name) ?? [];

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
              <dt className="font-medium text-muted-foreground">Roller</dt>
              <dd>
                {roleNames.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {roleNames.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">Bu gruba atanmış rol yok.</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Rol grubu bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
