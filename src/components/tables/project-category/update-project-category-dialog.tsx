"use client";

import { useState, useEffect } from "react";
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

type UpdateProjectCategoryDialogProps = {
  categoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateProjectCategoryDialog({ categoryId, open, onOpenChange }: UpdateProjectCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { data: category, isLoading } = api.projectCategory.getById.useQuery(
    { id: categoryId },
    { enabled: open && !!categoryId }
  );
  const router = useRouter();
  const utils = api.useUtils();
  const updateMutation = api.projectCategory.update.useMutation({
    onSuccess: () => {
      void utils.projectCategory.list.invalidate();
      void utils.projectCategory.getById.invalidate({ id: categoryId });
      router.refresh();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
    }
  }, [category]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ id: categoryId, name, description });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proje Kategorisini Düzenle</DialogTitle>
          <DialogDescription>
            Kategori bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-pc-name">Ad</Label>
              <Input
                id="update-pc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-pc-desc">Açıklama</Label>
              <Input
                id="update-pc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
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
