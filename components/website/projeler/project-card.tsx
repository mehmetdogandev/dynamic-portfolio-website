import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { sitePath } from '@/lib/website/site-nav'
import type { WebsiteProject } from '@/lib/website/types'

type ProjectCardProps = {
  project: WebsiteProject
  className?: string
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const imageAlt = project.coverImageAlt?.trim() || project.title

  return (
    <Link href={sitePath(`projeler/${project.slug}`)} className={className}>
      <Card className="group h-full overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={project.imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={project.imageSrc.startsWith('/api/files/')}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-heading text-foreground group-hover:text-primary line-clamp-1 font-semibold">
            {project.title}
          </h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {project.description}
          </p>
          {project.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="text-primary mt-3 flex items-center gap-1 text-sm">
            Detaylar
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
