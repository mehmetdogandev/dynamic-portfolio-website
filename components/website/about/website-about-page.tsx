'use client'

import { useMemo } from 'react'
import type { WebsiteNavItem } from '@/lib/website/site-nav'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { SectionAccentLine } from '@/components/website/motion/section-accent-line'
import { cn } from '@/lib/utils'
import '@/app/(site)/blog/blog-public-content.css'
import './about-public-content.css'

export function WebsiteAboutPage({
  navItem,
  pageTitle,
  html,
  updatedAtIso,
}: {
  navItem: WebsiteNavItem
  pageTitle: string
  html: string
  updatedAtIso: string
}) {
  const updatedLabel = useMemo(() => {
    try {
      const d = new Date(updatedAtIso)
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d)
    } catch {
      return null
    }
  }, [updatedAtIso])

  return (
    <article className="text-foreground/90 about-editorial-scope relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 border-b border-border/40 pb-10 sm:mb-12 sm:pb-12">
        <p className="text-primary mb-2 text-xs font-medium uppercase tracking-widest sm:text-sm">
          {navItem.subtitle ?? 'Kurumsal kimlik'}
        </p>
        <div className="w-fit max-w-full">
          <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {pageTitle}
          </h1>
          <SectionAccentLine className="mt-4 block" span="full" delay={0.05} />
        </div>
        {updatedLabel ? (
          <p className="text-muted-foreground mt-6 text-xs sm:text-sm">
            Son güncelleme: {updatedLabel}
          </p>
        ) : null}
      </header>

      <RevealOnScroll variant="fadeUp" delay={0.06}>
        <div
          className={cn(
            'about-prose-column blog-public-html prose prose-neutral max-w-none dark:prose-invert',
            'prose-headings:font-serif prose-headings:scroll-mt-24 prose-headings:text-primary',
            'prose-p:text-foreground/88 prose-p:leading-relaxed',
            'prose-strong:text-foreground prose-li:marker:text-primary/60',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline'
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </RevealOnScroll>
    </article>
  )
}
