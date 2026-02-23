import { siteConfig } from "@/config/site";
import { Card, CardContent } from "@/components/ui/card";
import { YoutubeEmbed } from "@/components/website/ui/youtube-embed";
import { SequentialTypewriter } from "@/components/website/ui/sequential-typewriter";

export function HeroSection() {
  const { title, subtitle, youtubeVideoId, quote } = siteConfig.hero;

  const heroTexts = [
    title,
    subtitle,
    ...(quote ? [quote] : []),
  ];

  return (
    <section className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 md:py-12">
      <div className="space-y-8 md:space-y-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-8">
          <div className="order-2 md:order-1 md:col-span-1">
            <Card className="h-full border-primary/20 bg-primary/5 py-4 shadow-md md:py-6">
              <CardContent className="space-y-3 px-4 md:px-6 pt-6">
                <SequentialTypewriter
                  texts={heroTexts}
                  speed={55}
                  blinkCount={3}
                  blinkInterval={450}
                  playKeySound={false}
                />
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
