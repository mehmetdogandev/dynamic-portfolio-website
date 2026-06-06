'use client'

import { useState, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ImageCinematicReveal,
  type ImageRevealDirection,
} from '@/components/website/motion/image-cinematic-reveal'
import { Button } from '@/components/ui/button'
import type {
  WebsiteBlogPost,
  WebsiteGalleryItem,
  WebsiteReference,
  WebsiteSolution,
} from '@/lib/website/types'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'
import { sitePath } from '@/lib/website/site-nav'
import {
  RevealOnScroll,
  type RevealVariant,
} from '@/components/website/motion/reveal-on-scroll'
import { SectionAccentLine } from '@/components/website/motion/section-accent-line'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

function TeaserCoverImage({
  src,
  alt,
  unoptimized,
  entranceDelayMs,
  direction,
  className,
  imageClassName = 'object-cover',
  onImageError,
}: {
  src: string
  alt: string
  unoptimized: boolean
  entranceDelayMs: number
  direction: ImageRevealDirection
  className: string
  imageClassName?: string
  onImageError?: () => void
}) {
  return (
    <div
      className={cn(
        'relative h-full w-full min-h-0 overflow-hidden',
        className
      )}
    >
      <ImageCinematicReveal
        src={src}
        alt={alt}
        sizes="(max-width: 1024px) 100vw, 50vw"
        unoptimized={unoptimized}
        imageClassName={imageClassName}
        entranceDelayMs={entranceDelayMs}
        direction={direction}
        onImageError={onImageError}
      />
    </div>
  )
}

function TeaserBlock({
  title,
  subtitle,
  href,
  cta,
  children,
  image,
  imageRight = false,
  textVariant = 'fadeUp',
  textDelay = 0,
}: {
  title: string
  subtitle: string
  href: string
  cta: string
  children: ReactNode
  image: ReactNode
  imageRight?: boolean
  textVariant?: RevealVariant
  textDelay?: number
}) {
  return (
    <div className="border-border/30 grid items-center gap-8 border-b py-16 last:border-0 sm:gap-10 lg:grid-cols-2 lg:py-20">
      <div className={cn(imageRight && 'lg:order-2')}>{image}</div>
      <RevealOnScroll
        variant={textVariant}
        delay={textDelay}
        className={cn(imageRight && 'lg:order-1')}
      >
        <p className="text-primary text-sm font-medium tracking-wide">
          {subtitle}
        </p>
        <div className="mt-1 w-fit max-w-full">
          <h2 className="text-primary font-serif inline-block text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <SectionAccentLine
            className="mt-3 block"
            span="full"
            delay={textDelay + 0.06}
          />
        </div>
        <div className="text-muted-foreground mt-4 space-y-3 text-sm leading-relaxed sm:text-base">
          {children}
        </div>
        <Button
          asChild
          variant="link"
          className="text-primary mt-4 h-auto p-0 font-semibold"
        >
          <Link href={href} className="inline-flex items-center gap-1">
            {cta}
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </RevealOnScroll>
    </div>
  )
}

export function WebsiteHomeTeasers({
  referencePreview,
  galleryPreview,
  blogPreview,
  solutionPreview,
}: {
  referencePreview: WebsiteReference | null
  galleryPreview: WebsiteGalleryItem | null
  blogPreview: WebsiteBlogPost | null
  solutionPreview: WebsiteSolution | null
}) {
  const blog = blogPreview
  const solution = solutionPreview
  const ref0 = referencePreview
  const gal0 = galleryPreview
  const [refLogoFailed, setRefLogoFailed] = useState(false)
  const showRefLogo = Boolean(ref0?.logoSrc) && !refLogoFailed

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {solution ? (
          <TeaserBlock
            title="Öne çıkan çözüm"
            subtitle="Çözümlerimiz"
            href={sitePath('solution')}
            cta="Tüm çözümler"
            imageRight
            textVariant="fadeUp"
            textDelay={0.04}
            image={
              <TeaserCoverImage
                src={solution.imageSrc}
                alt={
                  solution.coverImageAlt?.trim() ||
                  `${solution.title} çözüm görseli`
                }
                unoptimized={solution.imageSrc.startsWith('/api/files/')}
                entranceDelayMs={280}
                direction="fromRight"
                className="border-border/60 aspect-video rounded-xl border shadow-md"
              />
            }
          >
            <p className="text-foreground font-medium">{solution.title}</p>
            <p>{solution.description}</p>
          </TeaserBlock>
        ) : null}

        <TeaserBlock
          title="Referanslarımız"
          subtitle="Güven"
          href={sitePath('references')}
          cta="Tüm referanslar"
          textVariant="slideLeft"
          textDelay={0.06}
          image={
            ref0 && showRefLogo && ref0.logoSrc ? (
              <TeaserCoverImage
                src={ref0.logoSrc}
                alt={
                  ref0.logoAlt?.trim() || `${ref0.name.trim()} referans görseli`
                }
                unoptimized
                entranceDelayMs={300}
                direction="fromLeft"
                className="border-border/60 aspect-[4/3] rounded-xl border shadow-md"
                onImageError={() => setRefLogoFailed(true)}
              />
            ) : (
              <RevealOnScroll variant="scaleIn" delay={0.1}>
                <div className="border-border/60 relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-br from-secondary/80 to-accent/25 shadow-md">
                  {ref0 ? (
                    <div
                      className={cn(
                        'flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl font-bold tracking-tight text-white shadow-inner sm:size-32',
                        ref0.monogramClass ?? 'from-primary to-primary/80'
                      )}
                    >
                      {ref0.logoText ?? 'A'}
                    </div>
                  ) : (
                    <div className="flex size-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-3xl font-bold tracking-tight text-white shadow-inner sm:size-32">
                      AS
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            )
          }
        >
          {ref0 ? (
            <p>
              <span className="text-foreground font-medium">{ref0.name}</span> —{' '}
              {ref0.sector}. {ref0.description}
            </p>
          ) : (
            <p>
              Kurumsal dönüşüm ve entegrasyon çözümlerinde birlikte çalıştığımız
              iş ortaklarını keşfedin.
            </p>
          )}
        </TeaserBlock>

        {blog ? (
          <TeaserBlock
            title="Son yazı"
            subtitle="Bilgi merkezi"
            href={sitePath('blog')}
            cta="Tüm yazılar"
            imageRight
            textVariant="fadeUp"
            textDelay={0.08}
            image={
              blog.imageSrc ? (
                <TeaserCoverImage
                  src={blog.imageSrc}
                  alt={
                    blog.coverImageAlt?.trim() ||
                    `${blog.title} blog kapak görseli`
                  }
                  unoptimized={blog.imageSrc.startsWith('/api/files/')}
                  entranceDelayMs={300}
                  direction="fromRight"
                  className="border-border/60 aspect-video rounded-xl border shadow-md"
                />
              ) : (
                <div className="border-border/60 bg-primary/10 relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border p-6 shadow-md">
                  <p className="text-foreground text-center text-sm font-medium">
                    {blog.title}
                  </p>
                </div>
              )
            }
          >
            <p className="text-foreground/80 text-xs font-medium uppercase">
              {blog.category} · {blog.date}
            </p>
            <p className="text-foreground font-medium">{blog.title}</p>
            <p>{blog.excerpt}</p>
          </TeaserBlock>
        ) : null}

        <TeaserBlock
          title="Kurumsal medya"
          subtitle="Etkinlik"
          href={sitePath('galeri')}
          cta="Galeriye git"
          textVariant="slideLeft"
          textDelay={0.1}
          image={
            <TeaserCoverImage
              src={gal0?.imageSrc ?? WEBSITE_IMAGES.homeHero}
              alt={gal0?.alt ?? 'Kurumsal medya'}
              unoptimized={Boolean(gal0?.imageSrc?.startsWith('/api/files/'))}
              entranceDelayMs={320}
              direction="fromLeft"
              className="border-border/60 aspect-[4/3] rounded-xl border shadow-md"
            />
          }
        >
          <p>
            {gal0?.detail ??
              'Şirket etkinlikleri, ekip buluşmaları ve saha anlarından kareler.'}
          </p>
        </TeaserBlock>
      </div>
    </section>
  )
}
