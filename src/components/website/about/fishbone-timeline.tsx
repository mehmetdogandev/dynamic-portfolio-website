"use client";

import Image from "next/image";
import { experiences } from "@/data/mock-experiences";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string) {
  if (dateStr === "Devam") return "Devam";
  const [year, month] = dateStr.split("-");
  const months: Record<string, string> = {
    "01": "Oca",
    "02": "Şub",
    "03": "Mar",
    "04": "Nis",
    "05": "May",
    "06": "Haz",
    "07": "Tem",
    "08": "Ağu",
    "09": "Eyl",
    "10": "Eki",
    "11": "Kas",
    "12": "Ara",
  };
  return `${months[month ?? ""] ?? month ?? "?"} ${year ?? ""}`;
}

export function FishboneTimeline() {
  const sorted = [...experiences].sort((a, b) => {
    const dateA = a.endDate === "Devam" ? "9999-12" : a.endDate;
    const dateB = b.endDate === "Devam" ? "9999-12" : b.endDate;
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="relative w-full py-6">
      {/* Horizontal central spine */}
      <div className="absolute left-0 right-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-primary/30" />

      <div className="relative z-10 overflow-x-auto overflow-y-visible pb-4 scroll-smooth md:pb-6">
        <div className="flex min-w-max items-center justify-start gap-8 px-4 md:gap-12 md:px-8">
          {sorted.map((exp, i) => {
            const isTop = i % 2 === 0;
            return (
              <div
                key={exp.id}
                className="flex shrink-0 flex-col items-center"
                style={{ width: "min(300px, 80vw)" }}
              >
                {/* Card above spine */}
                {isTop && (
                  <>
                    <div className="mb-2 w-full max-w-[260px] overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                      {exp.image && (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={exp.image}
                            alt={exp.imageAlt ?? exp.company}
                            fill
                            className="object-cover"
                            sizes="260px"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <span className="text-muted-foreground text-xs">
                          {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                        </span>
                        <h3 className="font-heading mt-1 font-semibold text-foreground">
                          {exp.title}
                        </h3>
                        <p className="text-primary text-sm font-medium">{exp.company}</p>
                        <p className="text-muted-foreground text-xs">{exp.location}</p>
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                    <div className="h-3 w-0.5 bg-primary/50" />
                  </>
                )}

                {/* Node on spine */}
                <div className="size-3 shrink-0 rounded-full border-2 border-primary bg-background" />

                {/* Card below spine */}
                {!isTop && (
                  <>
                    <div className="mt-3 h-3 w-0.5 bg-primary/50" />
                    <div className="mt-2 w-full max-w-[260px] overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md">
                      {exp.image && (
                        <div className="relative aspect-video w-full overflow-hidden bg-muted">
                          <Image
                            src={exp.image}
                            alt={exp.imageAlt ?? exp.company}
                            fill
                            className="object-cover"
                            sizes="260px"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <span className="text-muted-foreground text-xs">
                          {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                        </span>
                        <h3 className="font-heading mt-1 font-semibold text-foreground">
                          {exp.title}
                        </h3>
                        <p className="text-primary text-sm font-medium">{exp.company}</p>
                        <p className="text-muted-foreground text-xs">{exp.location}</p>
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
