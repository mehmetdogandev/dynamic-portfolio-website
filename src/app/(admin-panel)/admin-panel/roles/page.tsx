"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RoleDataTable } from "@/components/tables/roles/role-data-table";
import { CreateRoleDialog } from "@/components/tables/roles/create-role-dialog";

export default function AdminRolesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: roles, isLoading } = api.role.list.useQuery();
  const { data: permissions } = api.permissions.getMyPermissionsFull.useQuery();
  const canCreate = permissions?.ROLES?.includes("CREATE") ?? false;
  const canRead = permissions?.ROLES?.includes("READ") ?? false;

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
        <h1 className="text-2xl font-semibold">Roller</h1>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>Yeni Rol</Button>
        )}
      </div>
      <Card>
        <CardContent className="pt-0">
          <RoleDataTable
            roles={roles ?? []}
            isLoading={isLoading}
            canRead={permissions?.ROLES?.includes("READ") ?? false}
            canUpdate={permissions?.ROLES?.includes("UPDATE") ?? false}
            canDelete={permissions?.ROLES?.includes("DELETE") ?? false}
          />
        </CardContent>
      </Card>
      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
