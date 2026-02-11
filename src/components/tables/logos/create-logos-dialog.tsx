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
import { getErrorMessage } from "@/lib/trpc/error-messages";

type CreateLogosDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateLogosDialog({ open, onOpenChange }: CreateLogosDialogProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const utils = api.useUtils();
  const createMutation = api.logo.create.useMutation({
    onSuccess: () => {
      void utils.logo.list.invalidate();
      onOpenChange(false);
      setName("");
      setPath("");
      setStatus("PASSIVE");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, path, status });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Logo</DialogTitle>
          <DialogDescription>Yeni logo bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-logo-name">Ad</Label>
            <Input
              id="create-logo-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-logo-path">Yol</Label>
            <Input
              id="create-logo-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-logo-status">Durum</Label>
            <select
              id="create-logo-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PASSIVE")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              disabled={createMutation.isPending}
            >
              <option value="ACTIVE">Aktif</option>
              <option value="PASSIVE">Pasif</option>
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
