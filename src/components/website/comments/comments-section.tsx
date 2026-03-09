"use client";

import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";

type Comment = {
  id: string;
  username: string;
  message: string;
  createdAt: Date;
};

type CommentsSectionProps = {
  entityType: "project";
  entityId: string;
  comments: Comment[];
};

export function CommentsSection({
  entityType,
  entityId,
  comments,
}: CommentsSectionProps) {
  const count = comments.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <h2 className="font-heading text-xl font-semibold">
          Yorumlar {count > 0 && `(${count})`}
        </h2>
      </CardHeader>
      <CardContent className="space-y-6">
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                username={c.username}
                message={c.message}
                createdAt={c.createdAt}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-12 text-center">
            <MessageCircle className="size-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Henüz yorum yok. İlk yorumu siz bırakın!
            </p>
          </div>
        )}

        <Separator />

        <CommentForm entityType={entityType} entityId={entityId} />
      </CardContent>
    </Card>
  );
}
