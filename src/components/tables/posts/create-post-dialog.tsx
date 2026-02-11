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

type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [name, setName] = useState("");
  const utils = api.useUtils();
  const createMutation = api.post.create.useMutation({
    onSuccess: () => {
      void utils.post.list.invalidate();
      onOpenChange(false);
      setName("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Post</DialogTitle>
          <DialogDescription>Yeni post bilgilerini girin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-post-name">Ad</Label>
            <Input
              id="create-post-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
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
