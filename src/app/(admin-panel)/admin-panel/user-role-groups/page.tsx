"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UserRoleGroupDataTable } from "@/components/tables/user-role-group/user-role-group-data-table";

export default function AdminUserRoleGroupsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Kullanıcı Rol Grupları</h1>
      <Card>
        <CardContent className="pt-0">
          <UserRoleGroupDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
