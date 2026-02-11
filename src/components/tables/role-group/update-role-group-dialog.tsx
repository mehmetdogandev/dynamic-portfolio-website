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

type UpdateRoleGroupDialogProps = {
  roleGroupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateRoleGroupDialog({ roleGroupId, open, onOpenChange }: UpdateRoleGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleId, setRoleId] = useState("");
  const { data: roleGroup, isLoading } = api.roleGroup.getById.useQuery(
    { id: roleGroupId },
    { enabled: open && !!roleGroupId }
  );
  const { data: roles } = api.role.list.useQuery(undefined, { enabled: open });
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
      setRoleId(roleGroup.roleId);
    }
  }, [roleGroup]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ id: roleGroupId, name, description, roleId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rol grubunu düzenle</DialogTitle>
          <DialogDescription>Rol grubu bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
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
              <Label htmlFor="update-rg-role">Rol</Label>
              <select
                id="update-rg-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                required
                disabled={updateMutation.isPending}
              >
                <option value="">Seçin</option>
                {roles?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {updateMutation.error && (
              <p className="text-sm text-destructive">{updateMutation.error.message}</p>
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
