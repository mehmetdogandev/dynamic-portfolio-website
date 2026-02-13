"use client";

import Image from "next/image";
import { teachers } from "@/data/mock-teachers";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTitle } from "@/components/website/ui/section-title";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
export function TeachersCarousel() {
  return (
    <section className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle
        title="Özel Ders Hocaları"
        subtitle="Alanında uzman eğitmenlerimizle tanışın"
        className="mb-8"
      />
      <div className="relative overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch]">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {teachers.map((teacher) => (
              <CarouselItem
                key={teacher.id}
                className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3"
              >
                <Card className="overflow-hidden border shadow-sm h-full flex flex-col">
                  <div className="relative aspect-square w-full bg-muted">
                    <Image
                      src={teacher.image}
                      alt={teacher.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <CardContent className="flex flex-1 flex-col gap-2 p-4">
                    <p className="font-semibold text-foreground">{teacher.name}</p>
                    <p className="text-primary text-sm font-medium">{teacher.branch}</p>
                    <div className="mt-auto rounded-md bg-muted/50 p-3 text-muted-foreground text-sm">
                      {teacher.shortInfo}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex -left-2 lg:-left-12" />
          <CarouselNext className="hidden sm:flex -right-2 lg:-right-12" />
        </Carousel>
      </div>
    </section>
  );
}
