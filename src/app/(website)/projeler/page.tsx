import { projects } from "@/data/mock-projects";
import { ProjectCard } from "@/components/website/projects/project-card";
import { SectionTitle } from "@/components/website/ui/section-title";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function ProjelerPage() {
  const sorted = [...projects].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <AnimateOnScroll variant="fadeUp">
        <SectionTitle
          title="Projeler"
          subtitle="Geliştirdiğim yazılım projeleri"
          className="mb-12"
        />
      </AnimateOnScroll>

      <AnimateOnScroll variant="fadeLeft" delay={0.06}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </AnimateOnScroll>
    </div>
  );
}
