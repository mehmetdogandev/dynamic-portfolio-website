import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/data/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

type ProjectDetailContentProps = {
  project: Project;
};

export function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  return (
    <div className="container max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/projeler">
        <Button variant="ghost" size="sm" className="mb-8 -ml-2">
          <ArrowLeft className="size-4 mr-2" />
          Projelere Dön
        </Button>
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            {project.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{project.date}</p>
        </div>

        {project.images.length > 0 && (
          <div className="space-y-4">
            {project.images.map((img, i) => (
              <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={img}
                  alt={`${project.imageAlt} - ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">Açıklama</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {project.longDescription}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-primary/10 px-4 py-2 text-primary text-sm font-medium"
            >
              {tech}
            </span>
          ))}
        </div>

        {project.links && project.links.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {project.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="size-4 mr-2" />
                  {link.label}
                </Button>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
