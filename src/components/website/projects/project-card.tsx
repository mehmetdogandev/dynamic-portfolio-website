import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/data/types";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

type ProjectCardProps = {
  project: Project;
  className?: string;
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Link href={`/projeler/${project.slug}`}>
      <Card className={`group h-full overflow-hidden border shadow-sm transition-shadow hover:shadow-md ${className ?? ""}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={project.images[0] ?? "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"}
            alt={project.imageAlt}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary">
            {project.title}
          </h3>
          <p className="mt-1 text-muted-foreground text-sm line-clamp-2">{project.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {project.stack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs"
              >
                {tech}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1 text-primary text-sm">
            Detaylar
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
