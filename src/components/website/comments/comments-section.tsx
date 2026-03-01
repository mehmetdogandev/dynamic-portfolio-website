"use client";

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
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-semibold">Yorumlar</h2>
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
        <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>
      )}
      <CommentForm entityType={entityType} entityId={entityId} />
    </div>
  );
}
