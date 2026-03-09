"use client";

import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
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

  const date = new Date(createdAt);
  const relativeTime = formatDistanceToNow(date, { addSuffix: true, locale: tr });
  const fullDate = format(date, "d MMM yyyy, HH:mm", { locale: tr });

  return (
    <div className="flex gap-3 rounded-lg bg-muted/30 p-4 shadow-sm transition-colors hover:bg-muted/50">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="text-sm">{initial || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <p className="font-medium">{username}</p>
          <span className="text-muted-foreground">·</span>
          <time
            title={fullDate}
            dateTime={date.toISOString()}
            className="text-sm text-muted-foreground"
          >
            {relativeTime}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
