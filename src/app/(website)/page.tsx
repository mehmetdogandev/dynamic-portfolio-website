import { HeroSection } from "@/components/website/home/hero-section";
import { FeaturedProjects } from "@/components/website/home/featured-projects";
import { BlogPreview } from "@/components/website/home/blog-preview";
import { CtaSection } from "@/components/website/home/cta-section";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function WebsitePage() {
  return (
    <>
      <AnimateOnScroll>
        <HeroSection />
      </AnimateOnScroll>
      <AnimateOnScroll>
        <FeaturedProjects />
      </AnimateOnScroll>
      <AnimateOnScroll>
        <BlogPreview />
      </AnimateOnScroll>
      <AnimateOnScroll>
        <CtaSection />
      </AnimateOnScroll>
    </>
  );
}
