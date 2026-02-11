"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PostDataTable } from "@/components/tables/posts/post-data-table";
import { CreatePostDialog } from "@/components/tables/posts/create-post-dialog";

export default function AdminPostsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: posts, isLoading } = api.post.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.POST?.includes("CREATE") ?? false;
  const canRead = permissions?.POST?.includes("READ") ?? false;

  if (!canRead) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-muted-foreground">Bu sayfayı görüntüleme yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Postlar</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Post</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <PostDataTable
            posts={posts ?? []}
            isLoading={isLoading}
            canRead={permissions?.POST?.includes("READ") ?? false}
            canUpdate={permissions?.POST?.includes("UPDATE") ?? false}
            canDelete={permissions?.POST?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreatePostDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
