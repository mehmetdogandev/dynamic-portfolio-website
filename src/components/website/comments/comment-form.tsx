"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/trpc/react";

type CommentFormProps = {
  entityType: "project";
  entityId: string;
  onSuccess?: () => void;
};

export function CommentForm({ entityType, entityId, onSuccess }: CommentFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const createMutation = api.project.discussion.create.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setUsername("");
      setEmail("");
      setMessage("");
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entityType !== "project") return;
    createMutation.mutate({
      projectId: entityId,
      userEmail: email,
      username,
      message,
    });
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <p className="text-sm text-green-800 dark:text-green-200">
          Yorumunuz için teşekkürler! E-posta adresinize gönderilen doğrulama linkine tıklayarak
          yorumunuzu yayına alabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="comment-username">Ad Soyad</Label>
          <Input
            id="comment-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Adınız"
            disabled={createMutation.isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment-email">E-posta</Label>
          <Input
            id="comment-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ornek@email.com"
            disabled={createMutation.isPending}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment-message">Yorumunuz</Label>
        <textarea
          id="comment-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Yorumunuzu yazın..."
          disabled={createMutation.isPending}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      {createMutation.error && (
        <p className="text-sm text-destructive">{createMutation.error.message}</p>
      )}
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Gönderiliyor..." : "Yorum Gönder"}
      </Button>
    </form>
  );
}
