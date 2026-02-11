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

type UpdateLogosDialogProps = {
  logoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateLogosDialog({ logoId, open, onOpenChange }: UpdateLogosDialogProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const { data: logo, isLoading } = api.logo.getById.useQuery({ id: logoId }, { enabled: open && !!logoId });
  const utils = api.useUtils();
  const updateMutation = api.logo.update.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
      void utils.logo.getById.invalidate({ id: logoId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (logo) {
      setName(logo.name);
      setPath(logo.path);
      setStatus(logo.status as "ACTIVE" | "PASSIVE");
    }
  }, [logo]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ id: logoId, name, path, status });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logoyu düzenle</DialogTitle>
          <DialogDescription>Logo bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-logo-name">Ad</Label>
              <Input
                id="update-logo-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-logo-path">Yol</Label>
              <Input
                id="update-logo-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-logo-status">Durum</Label>
              <select
                id="update-logo-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PASSIVE")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                disabled={updateMutation.isPending}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="PASSIVE">Pasif</option>
              </select>
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
