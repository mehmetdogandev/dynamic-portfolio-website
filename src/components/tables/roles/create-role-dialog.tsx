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

const PAGES = [
  "HOME_PAGE",
  "USERS",
  "ROLES",
  "ROLE_GROUPS",
  "USER_ROLES",
  "USER_ROLE_GROUPS",
  "LOGO",
  "POST",
] as const;
const PERMISSIONS = ["CREATE", "READ", "UPDATE", "DELETE", "ACCESS"] as const;
type Permission = (typeof PERMISSIONS)[number];

type CreateRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState<string>(PAGES[0]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const utils = api.useUtils();
  const createMutation = api.role.create.useMutation({
    onSuccess: () => {
      void utils.role.list.invalidate();
      onOpenChange(false);
      setName("");
      setDescription("");
      setPage(PAGES[0]);
      setPermissions([]);
    },
  });

  function togglePermission(p: Permission) {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, description, page: page as (typeof PAGES)[number], permissions });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Rol</DialogTitle>
          <DialogDescription>Yeni rol bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-role-name">Ad</Label>
            <Input
              id="create-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role-desc">Açıklama</Label>
            <Input
              id="create-role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-role-page">Sayfa</Label>
            <select
              id="create-role-page"
              value={page}
              onChange={(e) => setPage(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              disabled={createMutation.isPending}
            >
              {PAGES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Yetkiler</Label>
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p)}
                    onChange={() => togglePermission(p)}
                    disabled={createMutation.isPending}
                  />
                  {p}
                </label>
              ))}
            </div>
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
