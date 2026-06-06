'use client'

import Image from 'next/image'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import type { WebsiteGalleryGroup } from '@/lib/website/types'

type GallerySliderProps = {
  group: WebsiteGalleryGroup
}

export function GallerySlider({ group }: GallerySliderProps) {
  if (group.items.length === 0) return null

  return (
    <section className="mb-16">
      <h2 className="font-heading text-foreground mb-2 text-2xl font-bold">
        {group.title}
      </h2>
      {group.subtitle ? (
        <p className="text-muted-foreground mb-6 text-sm">{group.subtitle}</p>
      ) : (
        <div className="mb-6" />
      )}
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="relative w-full"
      >
        <CarouselContent className="-ml-4">
          {group.items.map((img) => (
            <CarouselItem
              key={img.id}
              className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={img.imageSrc}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 size-10 min-h-10 min-w-10" />
        <CarouselNext className="right-0 size-10 min-h-10 min-w-10" />
      </Carousel>
    </section>
  )
}
