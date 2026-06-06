import type { ReactNode } from 'react'
import type { WebsiteNavItem } from '@/lib/website/site-nav'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'

export function WebsitePageScaffold({
  item,
  children,
}: {
  item: WebsiteNavItem
  children: ReactNode
}) {
  return (
    <article className="text-foreground/90 mx-auto w-full max-w-6xl px-4 py-10 text-base leading-relaxed sm:px-6 sm:py-14">
      <RevealOnScroll variant="fadeUp" className="mb-8 w-full sm:mb-10">
        <header className="max-w-3xl">
          <p className="text-primary mb-1.5 text-sm font-medium tracking-wide">
            {item.subtitle}
          </p>
          <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {item.title}
          </h1>
          <div
            className="bg-primary mt-4 h-0.5 w-16 rounded-full"
            aria-hidden
          />
        </header>
      </RevealOnScroll>
      <RevealOnScroll variant="slideUp" delay={0.08} className="w-full">
        {children}
      </RevealOnScroll>
    </article>
  )
}
