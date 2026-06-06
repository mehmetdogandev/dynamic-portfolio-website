'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import {
  HERO_MIN_H,
  HeroNavArrows,
  useHeroKeyboard,
  wrapSlideIndex,
} from './hero-shared'

const PEEK = 'w-[min(100%,min(100vw,520px))] min-w-[min(100%,min(100vw,520px))]'

// ─── Drag-to-scroll hook ──────────────────────────────────────────────────────
/**
 * Pointer (mouse + touch) ile basılı tutup sürükleme ile scroll sağlar.
 * - `isDragging`: sürükleme sırasında true — onClick'leri engeller
 * - `threshold`: kaç px geçince "drag" sayılır (click ile karıştırma)
 * - Sürükleme bitince snap pozisyonuna otomatik scroll tetiklenir
 */
function useDragScroll(ref: React.RefObject<HTMLElement | null>) {
  const isDragging = useRef(false)
  const didDrag = useRef(false) // click ile drag ayrımı
  const startX = useRef(0)
  const startScroll = useRef(0)
  const THRESHOLD = 6 // px — bunun altı click sayılır

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onPointerDown = (e: PointerEvent) => {
      // Sadece sol tık / tek parmak
      if (e.button !== 0 && e.pointerType === 'mouse') return
      isDragging.current = true
      didDrag.current = false
      startX.current = e.clientX
      startScroll.current = el.scrollLeft
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
      el.style.userSelect = 'none'
      // Snap'i geçici kapat — sürükleme sırasında kilitlenmesin
      el.style.scrollSnapType = 'none'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - startX.current
      if (Math.abs(dx) > THRESHOLD) didDrag.current = true
      el.scrollLeft = startScroll.current - dx
    }

    const onPointerUp = (_e: PointerEvent) => {
      if (!isDragging.current) return
      isDragging.current = false
      el.style.cursor = ''
      el.style.userSelect = ''
      // Snap'i geri aç — tarayıcı en yakın snap noktasına otururr
      el.style.scrollSnapType = 'x mandatory'
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [ref])

  /**
   * onClick handler'larında bunu çağır:
   * sürükleme olduysa event'i iptal et, olmadıysa geç.
   */
  const preventIfDragged = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) e.stopPropagation()
  }, [])

  return { preventIfDragged }
}

// ─── Magnetic Tilt Hook ───────────────────────────────────────────────────────

function useMagneticTilt(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) / (rect.width / 2)
        const dy = (e.clientY - cy) / (rect.height / 2)
        setTilt({ x: dy * -7, y: dx * 7 })
      })
    }

    const onLeave = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setTilt({ x: 0, y: 0 })
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [ref, enabled])

  return tilt
}

// ─── Tek Kart ─────────────────────────────────────────────────────────────────

function PeekCard({
  slide,
  index,
  active,
  count,
  reduceMotion,
  onClick,
}: {
  slide: WebsiteHeroSlide
  index: number
  active: number
  count: number
  reduceMotion: boolean
  onClick: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isActive = index === active
  const dist = index - active

  const tilt = useMagneticTilt(
    cardRef as React.RefObject<HTMLElement | null>,
    isActive && !reduceMotion
  )

  const absD = Math.abs(dist)
  const sign = dist > 0 ? 1 : -1

  let translateZ = 0
  let rotateY = 0
  let translateX = 0
  let scale = 1
  let opacity = 1

  if (!reduceMotion) {
    if (isActive) {
      translateZ = 40
      rotateY = tilt.y
      translateX = 0
      scale = 1
      opacity = 1
    } else {
      translateZ = -60 * absD
      rotateY = sign * Math.min(absD * 18, 52)
      translateX = sign * absD * 12
      scale = Math.max(0.82, 1 - absD * 0.07)
      opacity = Math.max(0.28, 1 - absD * 0.28)
    }
  }

  const transform = reduceMotion
    ? isActive
      ? 'scale(1)'
      : 'scale(0.95)'
    : `perspective(900px) translateZ(${translateZ}px) rotateX(${isActive ? tilt.x : 0}deg) rotateY(${rotateY}deg) translateX(${translateX}px) scale(${scale})`

  const isVideo = slide.mimeType?.startsWith('video/') ?? false
  const alt = slide.imageAlt || slide.title

  return (
    <div
      data-peek-item={index}
      className={cn(
        'relative my-4 shrink-0 pl-2 pr-2 first:pl-4 last:pr-4 sm:my-8',
        PEEK
      )}
      style={{ scrollSnapAlign: 'center' }}
    >
      <div
        ref={cardRef}
        onClick={!isActive ? onClick : undefined}
        className={cn(
          'border-border/60 bg-card relative h-[min(60vh,520px)] w-full overflow-hidden rounded-2xl border shadow-2xl',
          !isActive && 'cursor-pointer'
        )}
        role="group"
        aria-roledescription="slayt"
        aria-label={`${index + 1} / ${count}`}
        style={{
          transform,
          transformOrigin: 'center center',
          transition: reduceMotion
            ? 'none'
            : `transform 0.75s cubic-bezier(0.34, 1.36, 0.64, 1),
               opacity   0.65s cubic-bezier(0.4, 0, 0.2, 1),
               box-shadow 0.6s ease`,
          opacity,
          zIndex: isActive ? count + 1 : count - absD,
          willChange: 'transform, opacity',
          boxShadow: isActive
            ? '0 32px 72px -12px rgba(0,0,0,0.55), 0 0 0 1px hsl(var(--border)/0.5)'
            : `0 ${8 + absD * 4}px ${32 + absD * 8}px -8px rgba(0,0,0,0.3)`,
        }}
      >
        {isVideo ? (
          <video
            title={alt}
            src={slide.mediaSrc}
            className="absolute inset-0 size-full object-cover"
            muted
            playsInline
            preload={index < 2 ? 'auto' : 'metadata'}
          />
        ) : (
          <Image
            src={slide.mediaSrc}
            alt={alt}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 520px"
            priority={index < 3}
          />
        )}

        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            isActive
              ? 'bg-gradient-to-t from-background/90 via-background/40 to-background/5'
              : 'bg-gradient-to-t from-background/80 via-background/55 to-background/20'
          )}
          aria-hidden
        />

        <div
          className="absolute inset-0 z-[1] flex flex-col justify-end p-5 sm:p-7"
          style={{
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1)',
            transitionDelay: isActive ? '0.2s' : '0s',
          }}
        >
          {isActive && index === 0 && !reduceMotion ? (
            <RevealOnScroll variant="fadeUp" className="max-w-md">
              <CardContent slide={slide} />
            </RevealOnScroll>
          ) : (
            <CardContent slide={slide} />
          )}
        </div>

        {!isActive && (
          <div
            className="absolute inset-0 z-[1] flex flex-col justify-end p-5 sm:p-7"
            style={{
              opacity: Math.max(0, 0.7 - absD * 0.25),
              transition: 'opacity 0.5s ease',
            }}
          >
            <h2 className="text-foreground/80 max-w-md text-lg font-medium sm:text-xl line-clamp-2">
              {slide.title}
            </h2>
          </div>
        )}
      </div>
    </div>
  )
}

function CardContent({ slide }: { slide: WebsiteHeroSlide }) {
  return (
    <>
      <h2 className="text-foreground max-w-md text-xl font-semibold sm:text-2xl">
        {slide.title}
      </h2>
      {slide.subtitle ? (
        <p className="text-foreground/85 mt-1 text-sm sm:text-base line-clamp-2">
          {slide.subtitle}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {slide.showPrimaryButton && slide.primaryHref && slide.primaryLabel ? (
          <Button asChild size="default">
            <Link href={slide.primaryHref}>{slide.primaryLabel}</Link>
          </Button>
        ) : null}
        {slide.showSecondaryButton &&
        slide.secondaryHref &&
        slide.secondaryLabel ? (
          <Button asChild size="default" variant="secondary">
            <Link href={slide.secondaryHref}>{slide.secondaryLabel}</Link>
          </Button>
        ) : null}
      </div>
    </>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function WebsiteHeroPeekCards({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const autoplayTimerRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)
  const [active, setActive] = useState(0)
  const [slideReady, setSlideReady] = useState(true)
  const reduceMotion = useReducedMotion()
  const scrollBehavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)

  // Drag-to-scroll — scrollerRef üzerinde çalışır
  const { preventIfDragged } = useDragScroll(
    scrollerRef as React.RefObject<HTMLElement | null>
  )

  const getScrollTargetLeft = useCallback(
    (el: HTMLElement, item: HTMLElement) => {
      const ideal = item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
      return Math.min(Math.max(0, ideal), maxScroll)
    },
    []
  )

  const updateActiveFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || count <= 0) return

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    const edgeEpsilon = 8

    if (maxScroll > 0 && el.scrollLeft >= maxScroll - edgeEpsilon) {
      setActive(count - 1)
      return
    }
    if (el.scrollLeft <= edgeEpsilon) {
      setActive(0)
      return
    }

    const items = el.querySelectorAll('[data-peek-item]')
    if (items.length === 0) return
    const viewportCenter = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let min = Infinity
    items.forEach((item, i) => {
      const node = item as HTMLElement
      const itemCenter = node.offsetLeft + node.offsetWidth / 2
      const d = Math.abs(itemCenter - viewportCenter)
      if (d < min) {
        min = d
        best = i
      }
    })
    setActive(best)
  }, [count])

  const markSlideReady = useCallback(() => {
    if (settleTimerRef.current) {
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
    setSlideReady(true)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateActiveFromScroll, { passive: true })
    const onScrollEnd = () => {
      updateActiveFromScroll()
      markSlideReady()
    }
    el.addEventListener('scrollend', onScrollEnd)
    updateActiveFromScroll()
    return () => {
      el.removeEventListener('scroll', updateActiveFromScroll)
      el.removeEventListener('scrollend', onScrollEnd)
    }
  }, [markSlideReady, updateActiveFromScroll])

  const goTo = useCallback(
    (index: number) => {
      const el = scrollerRef.current
      if (!el || count <= 0) return
      const wrapped = wrapSlideIndex(index, count)
      const item = el.querySelector(
        `[data-peek-item="${wrapped}"]`
      ) as HTMLElement | null
      if (!item) return

      setSlideReady(false)
      setActive(wrapped)

      const targetLeft = getScrollTargetLeft(el, item)

      if (reduceMotion) {
        el.scrollLeft = targetLeft
        updateActiveFromScroll()
        markSlideReady()
        return
      }

      el.scrollTo({
        left: targetLeft,
        behavior: scrollBehavior,
      })
      settleTimerRef.current = window.setTimeout(markSlideReady, 900)
    },
    [
      count,
      getScrollTargetLeft,
      markSlideReady,
      reduceMotion,
      scrollBehavior,
      updateActiveFromScroll,
    ]
  )

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  useHeroKeyboard({ slideCount: count, goPrev, goNext })

  useEffect(() => {
    if (count <= 1 || !slideReady) return

    if (autoplayTimerRef.current) {
      window.clearTimeout(autoplayTimerRef.current)
    }

    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null
      goTo(active + 1)
    }, autoplayMs)

    return () => {
      if (autoplayTimerRef.current) {
        window.clearTimeout(autoplayTimerRef.current)
        autoplayTimerRef.current = null
      }
    }
  }, [active, autoplayMs, count, goTo, slideReady])

  if (count === 0) return null

  return (
    <section
      className="relative w-full"
      style={{ minHeight: HERO_MIN_H }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ana tanıtım alanı"
      id="website-hero-peek-cards"
    >
      <div
        ref={scrollerRef}
        // cursor-grab: sürüklenebilir olduğunu kullanıcıya gösterir
        className="flex w-full cursor-grab flex-row items-stretch gap-0 overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
        style={{
          scrollSnapType: reduceMotion ? undefined : 'x mandatory',
          touchAction: 'pan-x',
        }}
        // Drag olduysa kartların onClick'ini engelle
        onClick={preventIfDragged}
      >
        {slides.map((slide, index) => (
          <PeekCard
            key={slide.id}
            slide={slide}
            index={index}
            active={active}
            count={count}
            reduceMotion={reduceMotion ?? false}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
      {count > 1 ? (
        <HeroNavArrows
          onPrev={goPrev}
          onNext={goNext}
          prevDisabled={count <= 1}
          nextDisabled={count <= 1}
        />
      ) : null}
    </section>
  )
}
