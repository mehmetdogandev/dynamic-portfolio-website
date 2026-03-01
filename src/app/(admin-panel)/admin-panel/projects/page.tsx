"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProjectDataTable } from "@/components/tables/project/project-data-table";

export default function AdminProjectsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <ProjectDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
