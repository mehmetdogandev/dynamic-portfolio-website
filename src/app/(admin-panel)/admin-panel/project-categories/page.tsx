"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProjectCategoryDataTable } from "@/components/tables/project-category/project-category-data-table";

export default function AdminProjectCategoriesPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent className="pt-0">
          <ProjectCategoryDataTable />
        </CardContent>
      </Card>
    </div>
  );
}
