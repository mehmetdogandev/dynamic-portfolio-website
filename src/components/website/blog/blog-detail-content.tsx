import Image from "next/image";
import type { BlogPost } from "@/data/types";
import { cn } from "@/lib/utils";
import { AnimateOnScroll } from "@/components/website/ui/animate-on-scroll";

type BlogDetailContentProps = {
  post: BlogPost;
  className?: string;
};

export function BlogDetailContent({ post, className }: BlogDetailContentProps) {
  return (
    <article className={cn("container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      <AnimateOnScroll variant="scale">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-8">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeUp" delay={0.05}>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl text-foreground mb-2">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-sm">{post.date}</p>
        </header>
      </AnimateOnScroll>
      <AnimateOnScroll variant="fadeRight" delay={0.08}>
        <div
          className="[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </AnimateOnScroll>
    </article>
  );
}
