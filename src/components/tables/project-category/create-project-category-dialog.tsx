"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

type CreateProjectCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectCategoryDialog({ open, onOpenChange }: CreateProjectCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const utils = api.useUtils();
  const createMutation = api.projectCategory.create.useMutation({
    onSuccess: () => {
      void utils.projectCategory.list.invalidate();
      router.refresh();
      onOpenChange(false);
      setName("");
      setDescription("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, description });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Proje Kategorisi</DialogTitle>
          <DialogDescription>
            Proje kategorisi bilgilerini girin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-pc-name">Ad</Label>
            <Input
              id="create-pc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
              placeholder="Örn: Web Uygulamaları"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-pc-desc">Açıklama</Label>
            <Input
              id="create-pc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={createMutation.isPending}
              placeholder="Kategori açıklaması"
            />
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
