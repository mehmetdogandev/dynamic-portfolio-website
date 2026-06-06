import { ProjectCard } from '@/components/website/projeler/project-card'
import type { WebsiteProject } from '@/lib/website/types'

export function WebsiteProjectGrid({
  projects,
}: {
  projects: WebsiteProject[]
}) {
  if (projects.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        Henüz yayınlanmış proje bulunmuyor.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
