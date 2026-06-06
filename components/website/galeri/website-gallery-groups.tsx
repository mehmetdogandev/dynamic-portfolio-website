'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type {
  WebsiteGalleryGroup,
  WebsiteGalleryItem,
} from '@/lib/website/types'
import { Button } from '@/components/ui/button'

function kindLabel(kind: WebsiteGalleryItem['kind']): string {
  if (kind === 'etkinlik') return 'Etkinlik'
  if (kind === 'solution') return 'Çözüm'
  if (kind === 'topluluk') return 'Topluluk'
  return 'Medya'
}

function GalleryCard({
  item,
  reducedMotion,
}: {
  item: WebsiteGalleryItem
  reducedMotion: boolean | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <figure
      className={cn(
        'group border-border/60 relative w-[min(85vw,320px)] shrink-0 snap-start overflow-hidden rounded-xl border bg-card shadow-sm sm:w-[280px]',
        'scroll-ml-4 first:scroll-ml-0'
      )}
    >
      <button
        type="button"
        className="relative block w-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={item.imageSrc}
            alt={item.alt}
            fill
            className={cn(
              'object-cover transition-transform duration-500',
              !reducedMotion && 'sm:group-hover:scale-[1.03]'
            )}
            sizes="320px"
          />
          <div
            className={cn(
              'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/95 via-background/55 to-transparent p-4 transition-opacity duration-300',
              open
                ? 'opacity-100'
                : 'opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
            )}
          >
            {item.kind ? (
              <span className="bg-primary/90 text-primary-foreground mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                {kindLabel(item.kind)}
              </span>
            ) : null}
            <figcaption className="text-foreground text-sm font-semibold leading-snug">
              {item.caption ?? item.title}
            </figcaption>
            {item.detail ? (
              <p className="text-muted-foreground mt-1 line-clamp-4 text-xs leading-relaxed">
                {item.detail}
              </p>
            ) : null}
          </div>
        </div>
      </button>
      <figcaption className="text-muted-foreground border-border/40 border-t px-3 py-2 text-xs sm:hidden">
        {item.title}
        <span className="block text-[10px] opacity-80">
          Ayrıntı için dokunun
        </span>
      </figcaption>
    </figure>
  )
}

function HorizontalRow({
  group,
  index,
}: {
  group: WebsiteGalleryGroup
  index: number
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const delta = Math.min(360, el.clientWidth * 0.85) * dir
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  return (
    <motion.section
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, delay: reducedMotion ? 0 : index * 0.08 }}
      className="border-border/40 border-b pb-12 last:border-0 last:pb-0"
    >
      <div className="mb-4 max-w-2xl">
        <h2 className="text-primary font-serif text-xl font-semibold tracking-tight sm:text-2xl">
          {group.title}
        </h2>
        {group.subtitle ? (
          <p className="text-muted-foreground mt-1 text-sm">{group.subtitle}</p>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollPaddingLeft: 0 }}
        >
          {group.items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-12 bg-gradient-to-r from-background to-transparent sm:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-12 bg-gradient-to-l from-background to-transparent sm:block" />

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-1/2 left-0 z-[2] hidden size-10 -translate-y-1/2 rounded-full shadow-md sm:flex"
          aria-label={`${group.title} grubunda sola kaydır`}
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-1/2 right-0 z-[2] hidden size-10 -translate-y-1/2 rounded-full shadow-md sm:flex"
          aria-label={`${group.title} grubunda sağa kaydır`}
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </motion.section>
  )
}

export function WebsiteGalleryGroups({
  groups,
}: {
  groups: WebsiteGalleryGroup[]
}) {
  return (
    <div className="space-y-14">
      {groups.map((group, index) => (
        <HorizontalRow key={group.id} group={group} index={index} />
      ))}
    </div>
  )
}
