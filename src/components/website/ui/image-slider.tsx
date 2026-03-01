"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type ImageSliderImage = {
  id: string;
  url: string;
};

type ImageSliderProps = {
  images: ImageSliderImage[];
  className?: string;
};

export function ImageSlider({ images, className }: ImageSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollButtons();
    emblaApi.on("select", updateScrollButtons);
  }, [emblaApi, updateScrollButtons]);

  if (!images.length) return null;

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-lg">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y gap-2">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative min-w-0 flex-[0_0_100%] aspect-video"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70 disabled:opacity-30"
              aria-label="Önceki"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70 disabled:opacity-30"
              aria-label="Sonraki"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
