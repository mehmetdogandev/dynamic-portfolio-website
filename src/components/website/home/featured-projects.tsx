import Link from "next/link";
import { getFeaturedProjects } from "@/data/mock-projects";
import { SectionTitle } from "@/components/website/ui/section-title";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function FeaturedProjects() {
  const projects = getFeaturedProjects().slice(0, 3);

  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16 lg:px-8">
      <SectionTitle
        title="Öne Çıkan Projeler"
        subtitle="Son dönemde üzerinde çalıştığım projeler"
        className="mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/projeler/${project.slug}`}>
            <Card className="group h-full overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={project.images[0] ?? "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"}
                  alt={project.imageAlt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary">
                  {project.title}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm line-clamp-2">{project.description}</p>
                <div className="mt-2 flex items-center gap-1 text-primary text-sm">
                  Detaylar
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/projeler"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Tüm Projeler
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
