import { siteConfig } from "@/config/site";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/website/ui/section-title";
import { Users, Target, Award } from "lucide-react";

const iconMap = {
  users: Users,
  target: Target,
  award: Award,
} as const;

export function AboutSections() {
  return (
    <div className="container max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle
        title="Hakkımızda"
        subtitle="Mimlevip Eğitim Kurumu"
        className="mb-12"
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {siteConfig.about.sections.map((section, i) => {
          const Icon = iconMap[section.icon as keyof typeof iconMap] ?? Users;
          return (
            <Card key={i} className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
