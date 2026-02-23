import { HeroSection } from "@/components/website/home/hero-section";
import { FeaturedProjects } from "@/components/website/home/featured-projects";
import { HomeStats } from "@/components/website/home/home-stats";
import { HomeHighlights } from "@/components/website/home/home-highlights";
import { BlogPreview } from "@/components/website/home/blog-preview";
import { HomeAboutTeaser } from "@/components/website/home/home-about-teaser";
import { CtaSection } from "@/components/website/home/cta-section";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function WebsitePage() {
  return (
    <>
      <AnimateOnScroll variant="fadeUp">
        <HeroSection />
      </AnimateOnScroll>
      <AnimateOnScroll variant="scale" delay={0.03}>
        <HomeStats />
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeLeft" delay={0.05}>
        <FeaturedProjects />
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeRight" delay={0.05}>
        <HomeHighlights />
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeUp" delay={0.05}>
        <BlogPreview />
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeRight" delay={0.06}>
        <HomeAboutTeaser />
      </AnimateOnScroll>
      <AnimateOnScroll variant="scale" delay={0.1}>
        <CtaSection />
      </AnimateOnScroll>
    </>
  );
}
