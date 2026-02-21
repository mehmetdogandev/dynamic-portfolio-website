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
      {/* Central spine - vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-primary/30" />

      <div className="space-y-0">
        {sorted.map((exp, i) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={exp.id}
              className={cn(
                "relative flex items-stretch py-4",
                isLeft ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Content card */}
              <div
                className={cn(
                  "z-10 w-[calc(50%-1.5rem)] min-w-0 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
                  isLeft ? "text-right" : "text-left"
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

              {/* Spacer + branch + node */}
              <div className="relative flex w-12 shrink-0 items-center justify-center">
                {/* Horizontal branch line */}
                <div
                  className={cn(
                    "absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-primary/50",
                    isLeft ? "left-0" : "right-0"
                  )}
                />
                {/* Node on spine */}
                <div className="relative z-10 size-3 shrink-0 rounded-full border-2 border-primary bg-background" />
              </div>

              {/* Empty space on other side */}
              <div className="w-[calc(50%-1.5rem)] shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
