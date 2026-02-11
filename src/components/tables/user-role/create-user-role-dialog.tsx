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

type CreateUserRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateUserRoleDialog({ open, onOpenChange }: CreateUserRoleDialogProps) {
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const { data: users } = api.user.list.useQuery({ page: 1, limit: 100 }, { enabled: open });
  const { data: roles } = api.role.list.useQuery({ page: 1, limit: 100 }, { enabled: open });
  const utils = api.useUtils();
  const createMutation = api.userRole.create.useMutation({
    onSuccess: () => {
      void utils.userRole.list.invalidate();
      onOpenChange(false);
      setUserId("");
      setRoleId("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !roleId) return;
    createMutation.mutate({ userId, roleId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıya rol ata</DialogTitle>
          <DialogDescription>Kullanıcı ve rol seçin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-ur-user">Kullanıcı</Label>
            <select
              id="create-ur-user"
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
            <Label htmlFor="create-ur-role">Rol</Label>
            <select
              id="create-ur-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
              disabled={createMutation.isPending}
            >
              <option value="">Seçin</option>
              {roles?.items.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {createMutation.error && (
            <p className="text-sm text-destructive">{createMutation.error.message}</p>
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
            <Button type="submit" disabled={createMutation.isPending || !userId || !roleId}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
