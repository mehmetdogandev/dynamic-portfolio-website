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

type UpdatePostDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdatePostDialog({ postId, open, onOpenChange }: UpdatePostDialogProps) {
  const [name, setName] = useState("");
  const { data: post, isLoading } = api.post.getById.useQuery({ id: postId }, { enabled: open && !!postId });
  const utils = api.useUtils();
  const updateMutation = api.post.update.useMutation({
    onSuccess: () => {
      void utils.post.list.invalidate();
      void utils.post.getById.invalidate({ id: postId });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (post) {
      setName(post.name);
    }
  }, [post]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ id: postId, name });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Postu düzenle</DialogTitle>
          <DialogDescription>Post bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="update-post-name">Ad</Label>
              <Input
                id="update-post-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={updateMutation.isPending}
              />
            </div>
            {updateMutation.error && (
              <p className="text-sm text-destructive">{updateMutation.error.message}</p>
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
