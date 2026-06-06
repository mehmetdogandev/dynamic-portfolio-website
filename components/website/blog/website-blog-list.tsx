import Image from 'next/image'
import Link from 'next/link'
import type { WebsiteBlogPost } from '@/lib/website/types'
import { sitePath } from '@/lib/website/site-nav'

export function WebsiteBlogList({ posts }: { posts: WebsiteBlogPost[] }) {
  return (
    <ul className="space-y-6">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={sitePath(`blog/${post.slug}`)}
            className="border-border/60 bg-card/80 flex flex-col gap-4 rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:gap-6 sm:p-5"
          >
            {post.imageSrc && (
              <div className="border-border/50 relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border sm:aspect-[5/3] sm:w-56">
                <Image
                  src={post.imageSrc}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                {post.category} · {post.date}
              </p>
              <h2 className="text-foreground mt-1 font-serif text-xl font-semibold tracking-tight">
                {post.title}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
