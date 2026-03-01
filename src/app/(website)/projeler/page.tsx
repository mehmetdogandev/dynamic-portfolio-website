import { ProjectsGrid } from "@/components/website/projects/projects-grid";
import { SectionTitle } from "@/components/website/ui/section-title";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function ProjelerPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <AnimateOnScroll variant="fadeUp">
        <SectionTitle
          title="Projeler"
          subtitle="Geliştirdiğim yazılım projeleri"
          className="mb-12"
        />
      </AnimateOnScroll>

      <ProjectsGrid />
    </div>
  );
}
