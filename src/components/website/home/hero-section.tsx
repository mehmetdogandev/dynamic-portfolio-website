import { siteConfig } from "@/config/site";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { YoutubeEmbed } from "@/components/website/ui/youtube-embed";
export function HeroSection() {
  const { title, subtitle, youtubeVideoId } = siteConfig.hero;

  return (
    <section className="container max-w-7xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4 md:gap-8">
        <div className="md:col-span-1 order-2 md:order-1">
          <Card className="h-full border-primary/20 bg-primary/5 shadow-md">
            <CardHeader>
              <h2 className="text-xl font-bold tracking-tight md:text-2xl text-foreground">
                {title}
              </h2>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm md:text-base">
              <p>{subtitle}</p>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3 order-1 md:order-2">
          <YoutubeEmbed
            videoId={youtubeVideoId}
            title="Mimlevip tanıtım"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
