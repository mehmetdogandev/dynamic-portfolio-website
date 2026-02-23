import { galleryCategories } from "@/data/mock-gallery";
import { GallerySlider } from "@/components/website/gallery/gallery-slider";
import { SectionTitle } from "@/components/website/ui/section-title";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

export default function GaleriPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <AnimateOnScroll variant="fadeUp">
        <SectionTitle
          title="Galeri"
          subtitle="Konferanslar, projeler ve topluluk etkinliklerinden görüntüler"
          className="mb-12"
        />
      </AnimateOnScroll>

      <div className="space-y-12">
        {galleryCategories.map((category, i) => (
          <AnimateOnScroll
            key={category.id}
            variant={i % 2 === 0 ? "fadeLeft" : "fadeRight"}
            delay={0.05 + i * 0.06}
          >
            <GallerySlider category={category} />
          </AnimateOnScroll>
        ))}
      </div>
    </div>
  );
}
