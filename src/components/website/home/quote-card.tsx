import { Card, CardContent } from "@/components/ui/card";

type QuoteCardProps = {
  quote: string;
  className?: string;
};

export function QuoteCard({ quote, className }: QuoteCardProps) {
  return (
    <Card className={`border-primary/20 bg-primary/5 shadow-md ${className ?? ""}`}>
      <CardContent className="pt-6">
        <blockquote className="font-heading text-lg italic text-foreground md:text-xl">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </CardContent>
    </Card>
  );
}
