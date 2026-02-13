import { cn } from "@/lib/utils";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl text-foreground">
        {title}
      </h2>
      {subtitle && <p className="text-muted-foreground text-base md:text-lg">{subtitle}</p>}
    </div>
  );
}
