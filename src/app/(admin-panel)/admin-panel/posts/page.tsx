"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PostDataTable } from "@/components/tables/posts/post-data-table";

export default function AdminPostsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Postlar</h1>
      <Card>
        <CardContent className="pt-0">
          <PostDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
