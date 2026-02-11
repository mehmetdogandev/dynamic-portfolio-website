"use client";

import { Card, CardContent } from "@/components/ui/card";
import { UserDataTable } from "@/components/tables/users/user-data-table";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <UserDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
