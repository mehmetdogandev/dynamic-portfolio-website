"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserRoleGroupDataTable } from "@/components/tables/user-role-group/user-role-group-data-table";
import { CreateUserRoleGroupDialog } from "@/components/tables/user-role-group/create-user-role-group-dialog";

export default function AdminUserRoleGroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: userRoleGroups, isLoading } = api.userRoleGroup.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.USER_ROLE_GROUPS?.includes("CREATE") ?? false;
  const canRead = permissions?.USER_ROLE_GROUPS?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Kullanıcı Rol Grupları</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Kullanıcı Rol Grubu</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <UserRoleGroupDataTable
            userRoleGroups={userRoleGroups ?? []}
            isLoading={isLoading}
            canRead={permissions?.USER_ROLE_GROUPS?.includes("READ") ?? false}
            canDelete={permissions?.USER_ROLE_GROUPS?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateUserRoleGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
