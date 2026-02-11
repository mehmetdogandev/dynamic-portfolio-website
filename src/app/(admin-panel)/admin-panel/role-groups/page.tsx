"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoleGroupDataTable } from "@/components/tables/role-group/role-group-data-table";
import { CreateRoleGroupDialog } from "@/components/tables/role-group/create-role-group-dialog";

export default function AdminRoleGroupsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: roleGroups, isLoading } = api.roleGroup.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.ROLE_GROUPS?.includes("CREATE") ?? false;
  const canRead = permissions?.ROLE_GROUPS?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Rol Grupları</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Rol Grubu</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <RoleGroupDataTable
            roleGroups={roleGroups ?? []}
            isLoading={isLoading}
            canRead={permissions?.ROLE_GROUPS?.includes("READ") ?? false}
            canUpdate={permissions?.ROLE_GROUPS?.includes("UPDATE") ?? false}
            canDelete={permissions?.ROLE_GROUPS?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateRoleGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
