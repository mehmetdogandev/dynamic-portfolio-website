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

type CreatePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePostDialog({ open, onOpenChange }: CreatePostDialogProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [imageId, setImageId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const utils = api.useUtils();
  const createMutation = api.post.create.useMutation({
    onSuccess: () => {
      void utils.post.list.invalidate();
      onOpenChange(false);
      setName("");
      setContent("");
      setImageId("");
      setCategoryId("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({ name, content, imageId, categoryId });
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
          <div className="space-y-2">
            <Label htmlFor="create-post-content">İçerik</Label>
            <Input
              id="create-post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-post-image-id">Kapak görseli ID (imageId)</Label>
            <Input
              id="create-post-image-id"
              value={imageId}
              onChange={(e) => setImageId(e.target.value)}
              required
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-post-category-id">Kategori ID (categoryId)</Label>
            <Input
              id="create-post-category-id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={createMutation.isPending}
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
