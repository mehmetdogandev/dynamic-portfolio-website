"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RoleGroupDataTable } from "@/components/tables/role-group/role-group-data-table";

export default function AdminRoleGroupsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <RoleGroupDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
