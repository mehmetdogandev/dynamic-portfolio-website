"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/trpc/react";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { ImageSlider } from "@/components/website/ui/image-slider";
import { CommentsSection } from "@/components/website/comments/comments-section";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

type ProjectDetailClientProps = {
  slug: string;
};

export function ProjectDetailClient({ slug }: ProjectDetailClientProps) {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";

  const { data: project, isLoading, error } = api.project.getBySlugPublic.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (isLoading)
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 aspect-video animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );

  if (error || !project)
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <p className="text-destructive">Proje bulunamadı.</p>
        <Button asChild className="mt-4">
          <Link href="/projeler">Projelere Dön</Link>
        </Button>
      </div>
    );

  const coverUrl = `/api/files/${project.imageId}/view`;
  const galleryImages =
    project.projectImages?.map((img) => ({
      id: img.id,
      url: `/api/files/${img.imageId}/view`,
    })) ?? [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <AnimateOnScroll variant="fadeUp">
        <Link href="/projeler">
          <Button variant="ghost" size="sm" className="mb-8 -ml-2">
            <ArrowLeft className="mr-2 size-4" />
            Projelere Dön
          </Button>
        </Link>

        <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
          {project.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {format(new Date(project.createdAt), "d MMMM yyyy")}
          {project.categoryName && ` • ${project.categoryName}`}
        </p>
      </AnimateOnScroll>

      <AnimateOnScroll variant="scale" delay={0.06} className="mt-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
          <Image
            src={coverUrl}
            alt={project.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
            priority
          />
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll variant="fadeRight" delay={0.1} className="mt-8">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(project.content) }}
        />
      </AnimateOnScroll>

      {galleryImages.length > 0 && (
        <AnimateOnScroll variant="fadeLeft" delay={0.12} className="mt-8">
          <h2 className="mb-4 font-heading text-xl font-semibold">Galeri</h2>
          <ImageSlider images={galleryImages} />
        </AnimateOnScroll>
      )}

      {verified && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <p className="text-sm text-green-800 dark:text-green-200">
            E-posta adresiniz doğrulandı. Yorumunuz admin onayından sonra yayınlanacaktır.
          </p>
        </div>
      )}

      <AnimateOnScroll variant="fadeUp" delay={0.14} className="mt-10">
        <CommentsSection
          entityType="project"
          entityId={project.id}
          comments={project.discussions ?? []}
        />
      </AnimateOnScroll>
    </div>
  );
}
