import { siteConfig } from "@/config/site";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { YoutubeEmbed } from "@/components/website/ui/youtube-embed";

export function HeroSection() {
  const { title, subtitle, youtubeVideoId, quote } = siteConfig.hero;

  return (
    <section className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
      <div className="space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-8">
          <div className="order-2 md:order-1 md:col-span-1">
            <Card className="h-full border-primary/20 bg-primary/5 py-4 shadow-md md:py-6">
              <CardHeader className="px-4 md:px-6">
                <h2 className="font-heading text-xl font-bold tracking-tight md:text-2xl text-foreground">
                  {title}
                </h2>
              </CardHeader>
              <CardContent className="space-y-3 px-4 md:px-6">
                <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>
                {quote && (
                  <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground text-sm">
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="order-1 md:order-2 md:col-span-3">
            <YoutubeEmbed
              videoId={youtubeVideoId}
              title="Mehmet Doğan tanıtım"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
