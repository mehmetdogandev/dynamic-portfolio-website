"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UserRoleDataTable } from "@/components/tables/user-role/user-role-data-table";

export default function AdminUserRolesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <UserRoleDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
