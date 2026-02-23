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

type UpdateRoleDialogProps = {
  roleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateRoleDialog({ roleId, open, onOpenChange }: UpdateRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState<string>(PAGES[0]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const { data: role, isLoading } = api.role.getById.useQuery({ id: roleId }, { enabled: open && !!roleId });
  const utils = api.useUtils();
  const updateMutation = api.role.update.useMutation({
    onSuccess: () => {
      void utils.role.list.invalidate();
      void utils.role.getById.invalidate({ id: roleId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setPage(role.page);
      setPermissions(
        Array.isArray(role.permissions) ? role.permissions : []
      );
    }
  }, [role]);

  function togglePermission(p: Permission) {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      id: roleId,
      name,
      description,
      page: page as (typeof PAGES)[number],
      permissions,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rolü düzenle</DialogTitle>
          <DialogDescription>Rol bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-role-name">Ad</Label>
              <Input
                id="update-role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-role-desc">Açıklama</Label>
              <Input
                id="update-role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-role-page">Sayfa</Label>
              <select
                id="update-role-page"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                disabled={updateMutation.isPending}
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
                      disabled={updateMutation.isPending}
                    />
                    {p}
                  </label>
                ))}
              </div>
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
