import { projects } from "@/data/mock-projects";
import { ProjectCard } from "@/components/website/projects/project-card";
import { SectionTitle } from "@/components/website/ui/section-title";

export default function ProjelerPage() {
  const sorted = [...projects].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle
        title="Projeler"
        subtitle="Geliştirdiğim yazılım projeleri"
        className="mb-12"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
