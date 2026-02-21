"use client";

import Image from "next/image";
import type { GalleryCategory } from "@/data/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type GallerySliderProps = {
  category: GalleryCategory;
};

export function GallerySlider({ category }: GallerySliderProps) {
  return (
    <section className="mb-16">
      <h2 className="font-heading mb-6 text-2xl font-bold text-foreground">
        {category.name}
      </h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="relative w-full"
      >
        <CarouselContent className="-ml-4">
          {category.images.map((img, i) => (
            <CarouselItem key={i} className="basis-full pl-4 sm:basis-1/2 lg:basis-1/3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={img.url}
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
  );
}
