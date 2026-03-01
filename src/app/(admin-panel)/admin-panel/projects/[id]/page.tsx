"use client";

import { useParams } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/trpc/react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: project, isLoading } = api.project.getById.useQuery({ id }, { enabled: !!id });

  if (isLoading)
    return (
      <div className="flex flex-1 items-center justify-center">Yükleniyor...</div>
    );

  if (!project)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p>Proje bulunamadı.</p>
        <Button asChild>
          <Link href="/admin-panel/projects">Projelere Dön</Link>
        </Button>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin-panel/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.slug}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/admin-panel/projects/${id}/edit`}>Düzenle</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-medium">Kapak Görseli</h3>
          <div className="relative aspect-video overflow-hidden rounded-lg border">
            <Image
              src={`/api/files/${project.imageId}/view`}
              alt={project.name}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Kategori:</span> {project.categoryName ?? "-"}
          </p>
          <p>
            <span className="font-medium">Yayında:</span>{" "}
            {project.isPublished ? "Evet" : "Hayır"}
          </p>
          <p>
            <span className="font-medium">Sıra:</span> {project.order}
          </p>
          {project.shortDescription && (
            <p>
              <span className="font-medium">Kısa Açıklama:</span>{" "}
              {project.shortDescription}
            </p>
          )}
        </div>
      </div>
      {project.projectImages && project.projectImages.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Galeri ({project.projectImages.length} görsel)</h3>
          <div className="flex flex-wrap gap-2">
            {project.projectImages.map((img) => (
              <div
                key={img.id}
                className="relative h-24 w-24 overflow-hidden rounded border"
              >
                <Image
                  src={`/api/files/${img.imageId}/view`}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-medium">İçerik</h3>
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.content) }}
        />
      </div>

      <ProjectPendingComments projectId={id} />
    </div>
  );
}

function ProjectPendingComments({ projectId }: { projectId: string }) {
  const utils = api.useUtils();
  const { data: pending, isLoading } = api.project.discussion.listPending.useQuery(
    { projectId },
    { enabled: !!projectId }
  );
  const approveMutation = api.project.discussion.approve.useMutation({
    onSuccess: () => {
      void utils.project.discussion.listPending.invalidate({ projectId });
      void utils.project.getById.invalidate({ id: projectId });
    },
  });
  const deleteMutation = api.project.discussion.delete.useMutation({
    onSuccess: () => {
      void utils.project.discussion.listPending.invalidate({ projectId });
    },
  });

  if (isLoading || !pending?.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Onay Bekleyen Yorumlar ({pending.length})</h3>
      <div className="space-y-3">
        {pending.map((d) => (
          <div
            key={d.id}
            className="rounded-lg border p-4"
          >
            <p className="font-medium">{d.username}</p>
            <p className="text-sm text-muted-foreground">{d.userEmail}</p>
            <p className="mt-2 text-sm">{d.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(d.createdAt), "d MMM yyyy, HH:mm")}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate({ id: d.id })}
                disabled={approveMutation.isPending}
              >
                <Check className="mr-1 h-4 w-4" />
                Onayla
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate({ id: d.id })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Reddet
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
