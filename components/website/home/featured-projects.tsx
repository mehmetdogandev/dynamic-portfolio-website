import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProjectCard } from '@/components/website/projeler/project-card'
import { SectionTitle } from '@/components/website/ui/section-title'
import { sitePath } from '@/lib/website/site-nav'
import type { WebsiteProject } from '@/lib/website/types'

export function FeaturedProjects({ projects }: { projects: WebsiteProject[] }) {
  const featured = projects.slice(0, 3)

  if (featured.length === 0) return null

  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Öne Çıkan Projeler"
        subtitle="Son dönemde üzerinde çalıştığım projeler"
        className="mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
        {featured.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={sitePath('projeler')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
        >
          Tüm Projeler
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
