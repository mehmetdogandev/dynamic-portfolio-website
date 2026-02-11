"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserDataTable } from "@/components/tables/users/user-data-table";
import { CreateUserDialog } from "@/components/tables/users/create-user-dialog";

export default function AdminUsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: users, isLoading } = api.user.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.USERS?.includes("CREATE") ?? false;
  const canRead = permissions?.USERS?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Kullanıcı</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <UserDataTable
            users={users ?? []}
            isLoading={isLoading}
            canRead={permissions?.USERS?.includes("READ") ?? false}
            canUpdate={permissions?.USERS?.includes("UPDATE") ?? false}
            canDelete={permissions?.USERS?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
