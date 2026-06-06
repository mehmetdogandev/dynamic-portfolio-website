import Image from 'next/image'
import type { WebsiteGalleryItem } from '@/lib/website/types'

export function WebsiteGalleryGrid({ items }: { items: WebsiteGalleryItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <figure
          key={item.id}
          className="border-border/60 group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md"
        >
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={item.imageSrc}
              alt={item.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <figcaption className="text-muted-foreground p-3 text-sm">
            {item.title}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
