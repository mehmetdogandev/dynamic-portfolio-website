"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LogosDataTable } from "@/components/tables/logos/logos-data-table";

export default function AdminLogosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <LogosDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
