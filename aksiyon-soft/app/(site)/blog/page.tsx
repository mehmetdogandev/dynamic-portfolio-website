import Image from 'next/image'
import Link from 'next/link'
import { WebsitePageScaffold } from '@/components/website/shared/website-page-scaffold'
import { WebsiteBlogList } from '@/components/website/blog/website-blog-list'
import { WEBSITE_MAIN_NAV, sitePath } from '@/lib/website/site-nav'
import { trpc } from '@/lib/trpc/server'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'blog')!
export const revalidate = 0

export async function generateMetadata() {
  return marketingPageMetadata({
    title: 'Bilgi merkezi',
    descriptionFallback: 'Duyurular, teknik notlar ve sektörel içerikler.',
    canonicalSegment: 'blog',
  })
}

export default async function BlogPage() {
  const posts = await trpc.blog.listPublic()
  const featured = posts[0]
  const categories = [...new Set(posts.map((post) => post.category))]

  return (
    <WebsitePageScaffold item={item}>
      {featured && (
        <Link
          href={sitePath(`blog/${featured.slug}`)}
          className="border-border/70 bg-card/90 mb-8 grid overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md md:grid-cols-2"
        >
          <div className="relative aspect-[16/10] md:aspect-auto md:min-h-64">
            <Image
              src={featured.imageSrc ?? '/logo.jpeg'}
              alt={
                featured.coverImageAlt?.trim() ||
                `${featured.title} kapak görseli`
              }
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Öne çıkan duyuru
            </p>
            <h2 className="text-foreground mt-2 font-serif text-2xl font-semibold tracking-tight">
              {featured.title}
            </h2>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {featured.excerpt}
            </p>
            <p className="text-muted-foreground mt-4 text-xs">
              {featured.category} · {featured.date}
            </p>
          </div>
        </Link>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className="bg-secondary text-secondary-foreground rounded-md px-2.5 py-1 text-xs font-medium"
          >
            {category}
          </span>
        ))}
      </div>

      <WebsiteBlogList posts={posts} />
    </WebsitePageScaffold>
  )
}
