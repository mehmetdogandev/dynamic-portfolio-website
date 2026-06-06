'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WebsiteHeroSlide } from '@/lib/website/types'

export const HERO_MIN_H = 'min(88vh,720px)'

/** Slayt indeksini 0 … count-1 aralığında döngüsel sarar. */
export function wrapSlideIndex(index: number, count: number): number {
  if (count <= 0) return 0
  return ((index % count) + count) % count
}

export function useHeroKeyboard({
  slideCount,
  goPrev,
  goNext,
}: {
  slideCount: number
  goPrev: () => void
  goNext: () => void
}) {
  useEffect(() => {
    if (slideCount <= 1) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (
        t instanceof HTMLElement &&
        t.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slideCount, goPrev, goNext])
}

export function HeroSlideMedia({
  slide,
  className,
  priority,
  videoClassName,
  sizes = '(max-width: 768px) 100vw, 50vw',
}: {
  slide: WebsiteHeroSlide
  className?: string
  priority?: boolean
  videoClassName?: string
  /** Passed to `next/image` for responsive loading. */
  sizes?: string
}) {
  const isVideo = slide.mimeType?.startsWith('video/') ?? false
  const alt = slide.imageAlt || slide.title
  if (isVideo) {
    return (
      <video
        title={alt}
        src={slide.mediaSrc}
        className={cn('size-full object-cover', videoClassName)}
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  return (
    <Image
      src={slide.mediaSrc}
      alt={alt}
      fill
      priority={priority}
      unoptimized
      className={cn('object-cover', className)}
      sizes={sizes}
    />
  )
}

export function HeroSlideCtas({
  slide,
  className,
}: {
  slide: WebsiteHeroSlide
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-wrap items-center gap-3 sm:mt-8',
        className
      )}
    >
      {slide.showPrimaryButton && slide.primaryHref && slide.primaryLabel ? (
        <Button asChild size="lg" className="font-medium">
          <Link href={slide.primaryHref}>{slide.primaryLabel}</Link>
        </Button>
      ) : null}
      {slide.showSecondaryButton &&
      slide.secondaryHref &&
      slide.secondaryLabel ? (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-border/80 bg-background/40 font-medium backdrop-blur-sm"
        >
          <Link href={slide.secondaryHref}>{slide.secondaryLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}

export function HeroNavArrows({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  className,
}: {
  onPrev: () => void
  onNext: () => void
  prevDisabled: boolean
  nextDisabled: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-1/2 z-[4] flex -translate-y-1/2 justify-between px-2 sm:px-4',
        className
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={prevDisabled}
        className="text-foreground/90 hover:text-foreground pointer-events-auto disabled:opacity-30"
        aria-label="Önceki slayt"
      >
        <ChevronLeft className="size-9 drop-shadow-md" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onNext}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={nextDisabled}
        className="text-foreground/90 hover:text-foreground pointer-events-auto disabled:opacity-30"
        aria-label="Sonraki slayt"
      >
        <ChevronRight className="size-9 drop-shadow-md" strokeWidth={1.75} />
      </button>
    </div>
  )
}
