import { HeroSection } from "@/components/website/home/hero-section";
import { FeaturedProjects } from "@/components/website/home/featured-projects";
import { BlogPreview } from "@/components/website/home/blog-preview";
import { CtaSection } from "@/components/website/home/cta-section";

export default function WebsitePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProjects />
      <BlogPreview />
      <CtaSection />
    </>
  );
}
