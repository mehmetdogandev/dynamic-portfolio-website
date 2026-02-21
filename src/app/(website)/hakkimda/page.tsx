"use client";

import { siteConfig } from "@/config/site";
import { SectionTitle } from "@/components/website/ui/section-title";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FishboneTimeline } from "@/components/website/about/fishbone-timeline";
import { SkillsInterests } from "@/components/website/about/skills-interests";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function HakkimdaPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle
        title="Hakkımda"
        subtitle={siteConfig.domain}
        className="mb-8"
      />

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-muted-foreground text-lg leading-relaxed">
          {siteConfig.about.intro}
        </p>
      </div>

      <Collapsible open={open} onOpenChange={setOpen} className="mt-12">
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 font-heading text-lg font-semibold shadow-sm hover:bg-accent/50">
          Deneyimlerim
          <ChevronDown
            className={`size-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-8">
            <FishboneTimeline />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <SkillsInterests />
    </div>
  );
}
