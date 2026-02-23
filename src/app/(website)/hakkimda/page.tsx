import { siteConfig } from "@/config/site";
import { SectionTitle } from "@/components/website/ui/section-title";
import { FishboneTimeline } from "@/components/website/about/fishbone-timeline";
import { SkillsInterests } from "@/components/website/about/skills-interests";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function HakkimdaPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <AnimateOnScroll variant="fadeUp">
        <SectionTitle
          title="Hakkımda"
          subtitle={siteConfig.domain}
          className="mb-8"
        />
      </AnimateOnScroll>

      <AnimateOnScroll variant="fadeRight" delay={0.08}>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 [font-family:var(--font-prose)]">
          <p className="text-foreground/90 text-xl font-medium italic leading-[1.9] sm:text-2xl">
            {siteConfig.about.lead}
          </p>
          <p className="text-muted-foreground text-lg leading-[1.9]">
            {siteConfig.about.intro}
          </p>
          <p className="text-muted-foreground text-lg leading-[1.9]">
            {siteConfig.about.introPart2}
          </p>
          <p className="text-muted-foreground text-lg leading-[1.9]">
            {siteConfig.about.introPart3}
          </p>
          <p className="text-muted-foreground text-lg leading-[1.9]">
            {siteConfig.about.introPart4}
          </p>
        </div>
      </AnimateOnScroll>

      <AnimateOnScroll variant="slideUp" delay={0.1}>
        <section className="mt-12">
          <h2 className="font-heading mb-8 text-2xl font-bold text-foreground">
            Deneyimlerim
          </h2>
          <FishboneTimeline />
        </section>
      </AnimateOnScroll>

      <AnimateOnScroll variant="scale" delay={0.12}>
        <SkillsInterests />
      </AnimateOnScroll>
    </div>
  );
}
