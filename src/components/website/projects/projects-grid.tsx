"use client";

import { api } from "@/lib/trpc/react";
import { ProjectCard } from "./project-card";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export function ProjectsGrid() {
  const { data: projects, isLoading } = api.project.listPublic.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => i).map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <p className="text-center text-muted-foreground">Henüz proje bulunmuyor.</p>
    );
  }

  return (
    <AnimateOnScroll variant="fadeLeft" delay={0.06}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              slug: project.slug,
              title: project.name,
              description: project.shortDescription ?? "",
              imageUrl: project.imageId ? `/api/files/${project.imageId}/view` : undefined,
            }}
          />
        ))}
      </div>
    </AnimateOnScroll>
  );
}
