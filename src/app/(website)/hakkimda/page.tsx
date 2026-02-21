import { siteConfig } from "@/config/site";
import { SectionTitle } from "@/components/website/ui/section-title";
import { FishboneTimeline } from "@/components/website/about/fishbone-timeline";
import { SkillsInterests } from "@/components/website/about/skills-interests";

export default function HakkimdaPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Hakkımda"
        subtitle={siteConfig.domain}
        className="mb-8"
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground text-lg leading-relaxed">
          {siteConfig.about.intro}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-heading mb-8 text-2xl font-bold text-foreground">
          Deneyimlerim
        </h2>
        <FishboneTimeline />
      </section>

      <SkillsInterests />
    </div>
  );
}
