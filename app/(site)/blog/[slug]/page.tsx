import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import '../blog-public-content.css'
import { WEBSITE_MAIN_NAV, sitePath } from '@/lib/website/site-nav'
import { trpc } from '@/lib/trpc/server'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'
import {
  absoluteFileViewUrl,
  buildPageMetadata,
  getSiteOrigin,
  publicCanonicalPathname,
  toAbsoluteUrl,
} from '@/lib/seo/build-page-metadata'
import { buildBlogPostingJsonLd } from '@/lib/seo/json-ld'
import { WebsiteJsonLdScript } from '@/components/website/seo/website-json-ld'

const navItem = WEBSITE_MAIN_NAV.find((n) => n.id === 'blog')!
export const revalidate = 0

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const posts = await trpc.blog.listPublic()
  const post = posts.find((item) => item.slug === slug)
  if (!post) return { title: 'Bilgi merkezi' }

  const site = await getPublicSiteSeo()
  const origin = getSiteOrigin()
  const title = post.seoTitle?.trim() || post.title
  const description =
    post.seoDescription?.trim() ||
    (post.excerpt ? post.excerpt.slice(0, 200) : '') ||
    site?.defaultMetaDescription?.trim() ||
    post.excerpt
  const ogPath = post.imageSrc ?? site?.defaultOgImageViewUrl ?? null

  return buildPageMetadata({
    title,
    description,
    canonicalPathname: publicCanonicalPathname(`blog/${slug}`),
    ogImageAbsoluteUrl: ogPath ? absoluteFileViewUrl(origin, ogPath) : null,
    robotsIndex: post.robotsIndex,
    twitterSite: site?.twitterSite ?? null,
    googleSiteVerification: site?.googleSiteVerification,
  })
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const posts = await trpc.blog.listPublic()
  const post = posts.find((item) => item.slug === slug)
  if (!post) notFound()

  const related = posts.filter((item) => item.slug != post.slug).slice(0, 2)

  const origin = getSiteOrigin()
  const postUrl = origin
    ? toAbsoluteUrl(origin, publicCanonicalPathname(`blog/${slug}`))
    : ''
  const imageUrl = post.imageSrc
    ? absoluteFileViewUrl(origin, post.imageSrc)
    : null
  const blogLd =
    postUrl &&
    buildBlogPostingJsonLd({
      url: postUrl,
      headline: post.title,
      description: (post.excerpt || post.title).slice(0, 500),
      datePublished: post.date,
      imageUrl,
    })

  const coverAlt = post.coverImageAlt?.trim() || post.title

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {blogLd ? <WebsiteJsonLdScript json={blogLd} /> : null}
      <header className="mb-8 max-w-3xl">
        <p className="text-primary mb-1 text-sm font-medium tracking-wide">
          {navItem.subtitle}
        </p>
        <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {post.category} · {post.date}
        </p>
      </header>

      {post.imageSrc && (
        <div className="border-border/60 relative mb-10 aspect-video w-full overflow-hidden rounded-xl border shadow-sm">
          <Image
            src={post.imageSrc}
            alt={coverAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1200px) 100vw, 1100px"
          />
        </div>
      )}

      <div
        className="blog-public-html prose prose-neutral dark:prose-invert max-w-3xl"
        dangerouslySetInnerHTML={{ __html: post.content.html }}
      />

      <section className="mt-12">
        <h2 className="text-primary font-serif text-2xl font-semibold">
          İlgili içerikler
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {related.map((item) => (
            <Link
              key={item.id}
              href={sitePath(`blog/${item.slug}`)}
              className="border-border/60 bg-card/70 hover:border-primary/50 rounded-xl border p-4 transition-colors"
            >
              <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                {item.category}
              </p>
              <p className="text-foreground mt-1 font-medium">{item.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {item.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
