"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogosDataTable } from "@/components/tables/logos/logos-data-table";
import { CreateLogosDialog } from "@/components/tables/logos/create-logos-dialog";

export default function AdminLogosPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: logos, isLoading } = api.logo.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.LOGO?.includes("CREATE") ?? false;
  const canRead = permissions?.LOGO?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Logolar</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Logo</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <LogosDataTable
            logos={logos ?? []}
            isLoading={isLoading}
            canRead={permissions?.LOGO?.includes("READ") ?? false}
            canUpdate={permissions?.LOGO?.includes("UPDATE") ?? false}
            canDelete={permissions?.LOGO?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateLogosDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
