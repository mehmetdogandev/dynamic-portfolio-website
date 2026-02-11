"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { getErrorMessage } from "@/lib/trpc/error-messages";
import { ScrollArea } from "@/components/ui/scroll-area";

type UpdateRoleGroupDialogProps = {
  roleGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateRoleGroupDialog({ roleGroupId, open, onOpenChange }: UpdateRoleGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const { data: roleGroup, isLoading: groupLoading } = api.roleGroup.getById.useQuery(
    { id: roleGroupId },
    { enabled: open && !!roleGroupId }
  );
  const { data: roles, isLoading: rolesLoading } = api.role.list.useQuery({ page: 1, limit: 100 }, { enabled: open });
  const utils = api.useUtils();
  const updateMutation = api.roleGroup.update.useMutation({
    onSuccess: () => {
      void utils.roleGroup.list.invalidate();
      void utils.roleGroup.getById.invalidate({ id: roleGroupId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (roleGroup) {
      setName(roleGroup.name);
      setDescription(roleGroup.description);
      setRoleIds(roleGroup.roleIds ?? []);
    }
  }, [roleGroup]);

  function toggleRole(roleId: string) {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ id: roleGroupId, name, description, roleIds });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rol grubunu düzenle</DialogTitle>
          <DialogDescription>
            Rol grubu bilgilerini ve gruba dahil rolleri güncelleyin.
          </DialogDescription>
        </DialogHeader>
        {groupLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-rg-name">Ad</Label>
              <Input
                id="update-rg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-rg-desc">Açıklama</Label>
              <Input
                id="update-rg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Roller (role.list üzerinden)</Label>
              {rolesLoading ? (
                <p className="text-sm text-muted-foreground">Roller yükleniyor...</p>
              ) : roles?.items.length ? (
                <ScrollArea className="h-[200px] rounded-md border p-3">
                  <div className="flex flex-col gap-2">
                    {roles.items.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={roleIds.includes(r.id)}
                          onChange={() => toggleRole(r.id)}
                          disabled={updateMutation.isPending}
                          className="h-4 w-4 rounded border-input"
                        />
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground">({r.page})</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz rol yok.</p>
              )}
            </div>
            {updateMutation.error && (
              <p className="text-sm text-destructive">{getErrorMessage(updateMutation.error)}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                İptal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
