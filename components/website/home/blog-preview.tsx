import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SectionTitle } from '@/components/website/ui/section-title'
import { sitePath } from '@/lib/website/site-nav'
import type { WebsiteBlogPost } from '@/lib/website/types'

export function BlogPreview({ posts }: { posts: WebsiteBlogPost[] }) {
  const preview = posts.slice(0, 3)
  if (preview.length === 0) return null

  return (
    <section className="container mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6 sm:pt-12 sm:pb-8 lg:px-8 lg:pt-16 lg:pb-10">
      <SectionTitle
        title="Blog"
        subtitle="Yazılım ve kariyer üzerine yazılarım"
        className="mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {preview.map((post) => (
          <Link key={post.id} href={sitePath(`blog/${post.slug}`)}>
            <Card className="group h-full overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {post.imageSrc ? (
                  <Image
                    src={post.imageSrc}
                    alt={post.coverImageAlt?.trim() || post.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-sm">
                    {post.title}
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-heading text-foreground group-hover:text-primary line-clamp-1 font-semibold">
                  {post.title}
                </h3>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {post.excerpt}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {post.date}
                </p>
                <div className="text-primary mt-2 flex items-center gap-1 text-sm">
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
          href={sitePath('blog')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors"
        >
          Tüm Yazılar
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
