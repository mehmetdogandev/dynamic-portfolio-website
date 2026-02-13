import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/data/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  post: BlogPost;
  className?: string;
};

export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} className={cn("block min-h-[44px] min-w-[44px]", className)}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={post.image}
            alt={post.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader>
          <h3 className="font-semibold text-foreground line-clamp-2">{post.title}</h3>
          <p className="text-muted-foreground text-sm">{post.date}</p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
