import { galleryCategories } from "@/data/mock-gallery";
import { GallerySlider } from "@/components/website/gallery/gallery-slider";
import { SectionTitle } from "@/components/website/ui/section-title";

export default function GaleriPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Galeri"
        subtitle="Konferanslar, projeler ve topluluk etkinliklerinden görüntüler"
        className="mb-12"
      />

      <div className="space-y-12">
        {galleryCategories.map((category) => (
          <GallerySlider key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
