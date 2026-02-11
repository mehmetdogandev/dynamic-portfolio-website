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
import { ScrollArea } from "@/components/ui/scroll-area";

type CreateRoleGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoleGroupDialog({ open, onOpenChange }: CreateRoleGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const { data: roles, isLoading: rolesLoading } = api.role.list.useQuery(undefined, { enabled: open });
  const utils = api.useUtils();
  const createMutation = api.roleGroup.create.useMutation({
    onSuccess: () => {
      void utils.roleGroup.list.invalidate();
      onOpenChange(false);
      setName("");
      setDescription("");
      setRoleIds([]);
    },
  });

  function toggleRole(roleId: string) {
    setRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, description, roleIds });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Rol Grubu</DialogTitle>
          <DialogDescription>
            Rol grubu bilgilerini girin ve gruba dahil edilecek rolleri seçin.
          </DialogDescription>
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
              placeholder="Örn: ADMIN"
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
              placeholder="Rol grubu açıklaması"
            />
          </div>
          <div className="space-y-2">
            <Label>Roller (role.list üzerinden)</Label>
            {rolesLoading ? (
              <p className="text-sm text-muted-foreground">Roller yükleniyor...</p>
            ) : roles?.length ? (
              <ScrollArea className="h-[200px] rounded-md border p-3">
                <div className="flex flex-col gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={roleIds.includes(r.id)}
                        onChange={() => toggleRole(r.id)}
                        disabled={createMutation.isPending}
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
