"use client";

import { useState } from "react";
import { Mail, MessageCircle, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-800 dark:text-green-200">
            Yorumunuz için teşekkürler! E-posta adresinize gönderilen doğrulama linkine tıklayarak
            yorumunuzu yayına alabilirsiniz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <h3 className="font-heading text-base font-semibold">Yorum Yaz</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-username">Ad Soyad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="comment-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Adınızı girin"
                  disabled={createMutation.isPending}
                  className={cn("pl-9")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="comment-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ornek@email.com"
                  disabled={createMutation.isPending}
                  className={cn("pl-9")}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-message">Yorumunuz</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Textarea
                id="comment-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Bu proje hakkında ne düşünüyorsunuz?"
                disabled={createMutation.isPending}
                className={cn("min-h-[100px] pl-9")}
              />
            </div>
          </div>
          {createMutation.error && (
            <p className="text-sm text-destructive">{createMutation.error.message}</p>
          )}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Gönderiliyor..." : "Yorum Gönder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
