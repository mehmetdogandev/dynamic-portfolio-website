"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RoleDataTable } from "@/components/tables/roles/role-data-table";

export default function AdminRolesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Roller</h1>
      <Card>
        <CardContent className="pt-0">
          <RoleDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
