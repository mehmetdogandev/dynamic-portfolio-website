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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";

type CreateRoleGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoleGroupDialog({ open, onOpenChange }: CreateRoleGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleId, setRoleId] = useState("");
  const { data: roles } = api.role.list.useQuery(undefined, { enabled: open });
  const utils = api.useUtils();
  const createMutation = api.roleGroup.create.useMutation({
    onSuccess: () => {
      void utils.roleGroup.list.invalidate();
      onOpenChange(false);
      setName("");
      setDescription("");
      setRoleId("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleId) return;
    createMutation.mutate({ name, description, roleId });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Rol Grubu</DialogTitle>
          <DialogDescription>Yeni rol grubu bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-rg-name">Ad</Label>
            <Input
              id="create-rg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-rg-desc">Açıklama</Label>
            <Input
              id="create-rg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-rg-role">Rol</Label>
            <select
              id="create-rg-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
              disabled={createMutation.isPending}
            >
              <option value="">Seçin</option>
              {roles?.map((r) => (
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
            <Button type="submit" disabled={createMutation.isPending || !roleId}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
