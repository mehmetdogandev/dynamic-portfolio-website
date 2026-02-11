"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";
import { getErrorMessage } from "@/lib/trpc/error-messages";

type CreateUserRoleGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateUserRoleGroupDialog({ open, onOpenChange }: CreateUserRoleGroupDialogProps) {
  const [userId, setUserId] = useState("");
  const [roleGroupId, setRoleGroupId] = useState("");
  const { data: users } = api.user.list.useQuery({ page: 1, limit: 100 }, { enabled: open });
  const { data: roleGroups } = api.roleGroup.list.useQuery({ page: 1, limit: 100 }, { enabled: open });
  const utils = api.useUtils();
  const createMutation = api.userRoleGroup.create.useMutation({
    onSuccess: () => {
      void utils.userRoleGroup.list.invalidate();
      onOpenChange(false);
      setUserId("");
      setRoleGroupId("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !roleGroupId) return;
    createMutation.mutate({ userId, roleGroupId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıya rol grubu ata</DialogTitle>
          <DialogDescription>Kullanıcı ve rol grubu seçin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-urg-user">Kullanıcı</Label>
            <select
              id="create-urg-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
              disabled={createMutation.isPending}
            >
              <option value="">Seçin</option>
              {users?.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-urg-rg">Rol Grubu</Label>
            <select
              id="create-urg-rg"
              value={roleGroupId}
              onChange={(e) => setRoleGroupId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
              disabled={createMutation.isPending}
            >
              <option value="">Seçin</option>
              {roleGroups?.items.map((rg) => (
                <option key={rg.id} value={rg.id}>
                  {rg.name}
                </option>
              ))}
            </select>
          </div>
          {createMutation.error && (
            <p className="text-sm text-destructive">{getErrorMessage(createMutation.error)}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !userId || !roleGroupId}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
