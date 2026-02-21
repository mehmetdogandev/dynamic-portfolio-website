import Link from "next/link";
import { blogPosts } from "@/data/mock-blog";
import { SectionTitle } from "@/components/website/ui/section-title";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function BlogPreview() {
  const posts = blogPosts.slice(0, 3);

  return (
    <section className="container max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionTitle
        title="Blog"
        subtitle="Yazılım ve kariyer üzerine yazılarım"
        className="mb-8"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="group h-full overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-heading font-semibold text-foreground line-clamp-1 group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm line-clamp-2">{post.excerpt}</p>
                <p className="mt-2 text-muted-foreground text-xs">{post.date}</p>
                <div className="mt-2 flex items-center gap-1 text-primary text-sm">
                  Oku
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Tüm Yazılar
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
