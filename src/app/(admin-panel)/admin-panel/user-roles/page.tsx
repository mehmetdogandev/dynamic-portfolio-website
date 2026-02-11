"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserRoleDataTable } from "@/components/tables/user-role/user-role-data-table";
import { CreateUserRoleDialog } from "@/components/tables/user-role/create-user-role-dialog";

export default function AdminUserRolesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: userRoles, isLoading } = api.userRole.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.USER_ROLES?.includes("CREATE") ?? false;
  const canRead = permissions?.USER_ROLES?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Kullanıcı Rolleri</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Kullanıcı Rolü</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <UserRoleDataTable
            userRoles={userRoles ?? []}
            isLoading={isLoading}
            canRead={permissions?.USER_ROLES?.includes("READ") ?? false}
            canDelete={permissions?.USER_ROLES?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateUserRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
