import type { Lesson } from "@/data/types";
import { YoutubeEmbed } from "@/components/website/ui/youtube-embed";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";

type LessonDetailLayoutProps = {
  lesson: Lesson;
};

export function LessonDetailLayout({ lesson }: LessonDetailLayoutProps) {
  return (
    <div className="container max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <aside className="lg:col-span-1 space-y-4 order-2 lg:order-1">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground mb-4">
                {lesson.title}
              </h1>
              <p className="text-muted-foreground leading-relaxed">{lesson.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-4" />
                <span>{lesson.videoCount} video</span>
              </div>
            </CardContent>
          </Card>
        </aside>
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          <h2 className="text-lg font-semibold text-foreground">Videolar</h2>
          <div className="space-y-4">
            {lesson.videoIds.map((videoId, index) => (
              <Card key={`${videoId}-${index}`} className="overflow-hidden">
                <YoutubeEmbed
                  videoId={videoId}
                  title={`${lesson.title} - Video ${index + 1}`}
                />
                <CardContent className="py-2">
                  <p className="text-muted-foreground text-sm">
                    {lesson.title} – Bölüm {index + 1}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
