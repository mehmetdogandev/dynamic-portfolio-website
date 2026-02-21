"use client";

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
    <div className="relative">
      {/* Mobile: simple vertical line on left */}
      <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-primary/30 md:hidden" />

      {/* Desktop: central spine */}
      <div className="absolute left-1/2 top-0 bottom-0 hidden w-0.5 -translate-x-1/2 bg-primary/30 md:block" />

      <div className="space-y-0">
        {sorted.map((exp, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={exp.id}
              className={cn(
                "relative flex items-stretch py-4 pl-8 md:pl-0",
                isLeft ? "flex-row md:flex-row" : "flex-row md:flex-row-reverse"
              )}
            >
              {/* Content card - full width on mobile (with left offset), half on desktop */}
              <div
                className={cn(
                  "z-10 min-w-0 flex-1 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md md:flex-none md:w-[calc(50%-1.5rem)]",
                  isLeft ? "md:text-right" : "text-left"
                )}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">
                    {formatDate(exp.startDate)} – {formatDate(exp.endDate)}
                  </span>
                  <h3 className="font-heading font-semibold text-foreground">{exp.title}</h3>
                  <p className="text-primary text-sm font-medium">{exp.company}</p>
                  <p className="text-muted-foreground text-xs">{exp.location}</p>
                  <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{exp.description}</p>
                </div>
              </div>

              {/* Mobile: dot on left */}
              <div className="absolute left-0 top-8 z-10 size-[23px] shrink-0 rounded-full border-2 border-primary bg-background md:hidden" />

              {/* Desktop: spacer + branch + node */}
              <div className="relative hidden w-12 shrink-0 items-center justify-center md:flex">
                <div
                  className={cn(
                    "absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-primary/50",
                    isLeft ? "left-0" : "right-0"
                  )}
                />
                <div className="relative z-10 size-3 shrink-0 rounded-full border-2 border-primary bg-background" />
              </div>

              {/* Desktop: empty space on other side */}
              <div className="hidden w-[calc(50%-1.5rem)] shrink-0 md:block" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
