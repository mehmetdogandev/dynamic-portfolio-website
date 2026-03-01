"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/trpc/react";

type DetailProjectCategoryDialogProps = {
  categoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DetailProjectCategoryDialog({ categoryId, open, onOpenChange }: DetailProjectCategoryDialogProps) {
  const { data: category, isLoading } = api.projectCategory.getById.useQuery(
    { id: categoryId },
    { enabled: open && !!categoryId }
  );

  const relatedProjects = category?.relatedProjects ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proje Kategorisi Detayı</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : category ? (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Ad</dt>
              <dd>{category.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Açıklama</dt>
              <dd>{category.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">İlişkili Projeler</dt>
              <dd>
                {relatedProjects.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    {relatedProjects.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/admin-panel/projects/${p.id}`}
                          className="text-primary hover:underline"
                        >
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">Bu kategoride proje yok.</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Kategori bulunamadı.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
