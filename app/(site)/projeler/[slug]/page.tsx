import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import '../../blog/blog-public-content.css'
import { getPublicProjects } from '@/lib/data/website-projects'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'
import { WEBSITE_MAIN_NAV, sitePath } from '@/lib/website/site-nav'
import {
  absoluteFileViewUrl,
  buildPageMetadata,
  getSiteOrigin,
  publicCanonicalPathname,
} from '@/lib/seo/build-page-metadata'

const navItem = WEBSITE_MAIN_NAV.find((n) => n.id === 'projeler')!

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const projects = await getPublicProjects()
  const project = projects.find((item) => item.slug === slug)
  if (!project) return { title: 'Projelerimiz' }

  const site = await getPublicSiteSeo()
  const origin = getSiteOrigin()
  const title = project.seoTitle?.trim() || project.title
  const description =
    project.seoDescription?.trim() ||
    project.description.slice(0, 200) ||
    site?.defaultMetaDescription?.trim() ||
    project.description
  const ogPath = project.imageSrc ?? site?.defaultOgImageViewUrl ?? null

  return buildPageMetadata({
    title,
    description,
    canonicalPathname: publicCanonicalPathname(`projeler/${slug}`),
    ogImageAbsoluteUrl: ogPath ? absoluteFileViewUrl(origin, ogPath) : null,
    robotsIndex: project.robotsIndex,
    twitterSite: site?.twitterSite ?? null,
    googleSiteVerification: site?.googleSiteVerification,
  })
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const projects = await getPublicProjects()
  const project = projects.find((item) => item.slug === slug)
  if (!project) notFound()

  const relatedProjects = projects
    .filter((item) => item.slug !== project.slug)
    .slice(0, 2)

  const coverAlt = project.coverImageAlt?.trim() || project.title

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-8 max-w-3xl">
        <p className="text-primary mb-1 text-sm font-medium tracking-wide">
          {navItem.subtitle}
        </p>
        <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">{project.sector}</p>
      </header>

      {/* Cover görseli — hover'da image scale up, kart yukarı kalkar */}
      <div className="border-border/60 group relative mb-10 aspect-video w-full overflow-hidden rounded-xl border shadow-sm transition-shadow duration-500 hover:shadow-xl">
        <Image
          src={project.imageSrc}
          alt={coverAlt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 1200px) 100vw, 1100px"
          unoptimized={project.imageSrc.startsWith('/api/files/')}
        />
      </div>

      <div
        className="blog-public-html prose prose-neutral dark:prose-invert text-foreground/90 max-w-3xl"
        dangerouslySetInnerHTML={{ __html: project.content.html }}
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-primary font-serif text-2xl font-semibold">
          Diğer projeler
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {relatedProjects.map((item) => (
            <Link
              key={item.id}
              href={sitePath(`projeler/${item.slug}`)}
              className="border-border/60 bg-card/70 hover:border-primary/50 group overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Küçük görsel varsa onu da zoom'la */}
              {item.imageSrc && (
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={item.imageSrc}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized={item.imageSrc.startsWith('/api/files/')}
                  />
                </div>
              )}
              <div className="p-4">
                <p className="text-muted-foreground text-xs">{item.sector}</p>
                <p className="text-foreground mt-1 font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}
