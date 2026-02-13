import Link from "next/link";
import Image from "next/image";
import type { Lesson } from "@/data/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonCardProps = {
  lesson: Lesson;
  className?: string;
};

export function LessonCard({ lesson, className }: LessonCardProps) {
  return (
    <Link
      href={`/ders-videolari/${lesson.slug}`}
      className={cn("block min-h-[44px] min-w-[44px]", className)}
    >
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={lesson.image}
            alt={lesson.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-white text-xs">
            <Video className="size-3" />
            {lesson.videoCount} video
          </div>
        </div>
        <CardHeader>
          <h3 className="font-semibold text-foreground line-clamp-2">{lesson.title}</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-2">{lesson.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
