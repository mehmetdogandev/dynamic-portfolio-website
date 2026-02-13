import { cn } from "@/lib/utils";

type YoutubeEmbedProps = {
  videoId: string;
  title?: string;
  className?: string;
};

export function YoutubeEmbed({ videoId, title = "YouTube video", className }: YoutubeEmbedProps) {
  const src = `https://www.youtube.com/embed/${videoId}?rel=0`;
  return (
    <div className={cn("w-full overflow-hidden rounded-lg bg-muted", className)}>
      <div className="relative aspect-video w-full">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    </div>
  );
}
