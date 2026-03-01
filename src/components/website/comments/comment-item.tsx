"use client";

import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type CommentItemProps = {
  username: string;
  message: string;
  createdAt: Date;
};

export function CommentItem({ username, message, createdAt }: CommentItemProps) {
  const initial = username
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="text-sm">{initial || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{username}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(createdAt), "d MMM yyyy, HH:mm")}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm">{message}</p>
      </div>
    </div>
  );
}
