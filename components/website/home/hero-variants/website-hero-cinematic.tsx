'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import {
  HERO_MIN_H,
  HeroNavArrows,
  useHeroKeyboard,
  wrapSlideIndex,
} from './hero-shared'

/** Giden biraz daha uzun; tek eğri ile akıcı kayma */
const SLIDE_OUT_MS = 1050
const SLIDE_IN_MS = 900
const SLIDE_IN_DELAY_MS = 60
const SLIDE_TRANSITION_MS = SLIDE_OUT_MS + 40
const SLIDE_EASE = 'cubic-bezier(0.45, 0.05, 0.25, 1)'

/** Kaç ms basılı tutulunca "long press" sayılır */
const LONG_PRESS_MS = 480

type SlideTransition = {
  from: number
  to: number
  direction: 1 | -1
}

function getSlideDirection(from: number, to: number, count: number): 1 | -1 {
  if (count <= 1 || to === from) return 1
  if (from === count - 1 && to === 0) return 1
  if (from === 0 && to === count - 1) return -1
  return to > from ? 1 : -1
}

// ─── Long Press Hook ──────────────────────────────────────────────────────────
/**
 * Bir elemana basılı tutunca yön bilgisiyle callback çağırır.
 * - Ekranın sol yarısı → prev, sağ yarısı → next
 * - Kısa tıklamalar (< LONG_PRESS_MS) tetiklemez
 * - Parmak/mouse hareket ederse (> threshold) iptal olur
 * - `progress` (0→1): basılı tutma ilerlemesi — progress bar için
 */
function useLongPress(
  ref: React.RefObject<HTMLElement | null>,
  onFire: (direction: 'prev' | 'next') => void,
  enabled: boolean
) {
  const [progress, setProgress] = useState(0) // 0..1
  const [pressing, setPressing] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const directionRef = useRef<'prev' | 'next'>('next')
  const firedRef = useRef(false)

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    timerRef.current = null
    rafRef.current = null
    firedRef.current = false
    setPressing(false)
    setProgress(0)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const tickProgress = () => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(elapsed / LONG_PRESS_MS, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tickProgress)
      }
    }

    const onDown = (e: PointerEvent) => {
      // Sadece primary pointer
      if (!e.isPrimary) return
      startXRef.current = e.clientX
      startYRef.current = e.clientY
      startTimeRef.current = Date.now()
      firedRef.current = false

      // Ekranın sol/sağ yarısına göre yön belirle
      const rect = el.getBoundingClientRect()
      directionRef.current =
        e.clientX < rect.left + rect.width / 2 ? 'prev' : 'next'

      setPressing(true)
      setProgress(0)
      rafRef.current = requestAnimationFrame(tickProgress)

      timerRef.current = setTimeout(() => {
        if (!firedRef.current) {
          firedRef.current = true
          onFire(directionRef.current)
        }
        cancel()
      }, LONG_PRESS_MS)
    }

    const onMove = (e: PointerEvent) => {
      if (!e.isPrimary) return
      const dx = Math.abs(e.clientX - startXRef.current)
      const dy = Math.abs(e.clientY - startYRef.current)
      // 10px'den fazla hareket ederse iptal
      if (dx > 10 || dy > 10) cancel()
    }

    const onUp = () => cancel()

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      cancel()
    }
  }, [ref, enabled, onFire, cancel])

  return { progress, pressing }
}

// ─── Long Press İlerleme Halkası ──────────────────────────────────────────────
/**
 * Basılı tutulurken ekranın sol/sağ kenarında dairesel progress gösterir.
 * Kullanıcıya "biraz daha tut" hissi verir.
 */
function LongPressIndicator({
  progress,
  pressing,
  direction,
}: {
  progress: number
  pressing: boolean
  direction: 'prev' | 'next'
}) {
  const r = 18
  const circ = 2 * Math.PI * r
  const dash = circ * progress

  if (!pressing && progress === 0) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-1/2 z-[6] -translate-y-1/2 transition-opacity duration-200',
        direction === 'prev' ? 'left-5' : 'right-5',
        pressing ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden
    >
      <svg width="44" height="44" viewBox="0 0 44 44">
        {/* Arka halka */}
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          strokeOpacity="0.15"
        />
        {/* İlerleme halkası */}
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          strokeOpacity="0.85"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{ transition: 'stroke-dasharray 0.05s linear' }}
        />
        {/* Ok işareti */}
        <text
          x="22"
          y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fill="hsl(var(--foreground))"
          fontSize="11"
          opacity={0.7}
        >
          {direction === 'prev' ? '←' : '→'}
        </text>
      </svg>
    </div>
  )
}

// ─── Fade Metin ───────────────────────────────────────────────────────────────

function FadeReveal({
  text,
  animKey,
  delay,
  className,
  reduceMotion,
  as: Tag = 'span',
}: {
  text: string
  animKey: number
  delay: number
  className?: string
  reduceMotion: boolean
  as?: 'span' | 'p' | 'h2'
}) {
  if (reduceMotion) return <Tag className={className}>{text}</Tag>
  return (
    <Tag
      key={animKey}
      className={cn('lux-fade', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {text}
    </Tag>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function WebsiteHeroCinematic({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const [slideTransition, setSlideTransition] =
    useState<SlideTransition | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const isAnimating = useRef(false)
  const sectionRef = useRef<HTMLElement>(null)

  const reduceMotion = useReducedMotion()
  const slideCount = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slide = slides[active]!

  useEffect(() => {
    if (!slideTransition) return
    const timer = window.setTimeout(() => {
      setActive(slideTransition.to)
      setSlideTransition(null)
      setAnimKey((k) => k + 1)
      isAnimating.current = false
    }, SLIDE_TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [slideTransition])

  // ── Geçiş ──────────────────────────────────────────────────────────────────
  const performTransition = useCallback(
    (target: number) => {
      const wrapped = wrapSlideIndex(target, slideCount)
      if (wrapped === active || isAnimating.current) return

      if (reduceMotion) {
        setActive(wrapped)
        setAnimKey((k) => k + 1)
        return
      }

      isAnimating.current = true
      setSlideTransition({
        from: active,
        to: wrapped,
        direction: getSlideDirection(active, wrapped, slideCount),
      })
    },
    [active, slideCount, reduceMotion]
  )

  const goTo = useCallback(
    (i: number) => performTransition(i),
    [performTransition]
  )
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  useHeroKeyboard({ slideCount, goPrev, goNext })

  // ── Long press ─────────────────────────────────────────────────────────────
  const [longPressDirection, setLongPressDirection] = useState<'prev' | 'next'>(
    'next'
  )

  const handleLongPress = useCallback(
    (direction: 'prev' | 'next') => {
      setLongPressDirection(direction)
      if (direction === 'prev') goPrev()
      else goNext()
    },
    [goPrev, goNext]
  )

  const { progress, pressing } = useLongPress(
    sectionRef as React.RefObject<HTMLElement | null>,
    handleLongPress,
    !reduceMotion && slideCount > 1
  )

  // Basılı tutulurken hangi yön gösterileceğini takip et
  const [hoverSide, setHoverSide] = useState<'prev' | 'next'>('next')
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!pressing) {
        const rect = e.currentTarget.getBoundingClientRect()
        setHoverSide(e.clientX < rect.left + rect.width / 2 ? 'prev' : 'next')
      }
    },
    [pressing]
  )

  // ── Autoplay ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (slideCount <= 1) return
    const timer = window.setInterval(() => {
      if (!isAnimating.current) performTransition((active + 1) % slideCount)
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [active, autoplayMs, slideCount, performTransition])

  if (slideCount === 0) return null

  const navDisabled = slideCount <= 1 || slideTransition !== null

  return (
    <>
      <style>{`
        @keyframes lux-fade-in {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .lux-fade {
          opacity: 0;
          animation: lux-fade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lux-nav-line {
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease;
        }
        .lux-nav-active   { width: 28px; opacity: 1; }
        .lux-nav-inactive { width: 8px;  opacity: 0.3; }
        .lux-nav-inactive:hover { opacity: 0.6; }
        .lux-counter {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.15em;
        }
        @keyframes lux-slide-out-move-next {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(-30%, 0, 0) scale(0.94); }
        }
        @keyframes lux-slide-out-fade {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes lux-slide-in-move-next {
          from { transform: translate3d(22%, 0, 0) scale(1.03); }
          to { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes lux-slide-in-fade {
          from { opacity: 0.55; }
          to { opacity: 1; }
        }
        @keyframes lux-slide-out-move-prev {
          from { transform: translate3d(0, 0, 0) scale(1); }
          to { transform: translate3d(30%, 0, 0) scale(0.94); }
        }
        @keyframes lux-slide-in-move-prev {
          from { transform: translate3d(-22%, 0, 0) scale(1.03); }
          to { transform: translate3d(0, 0, 0) scale(1); }
        }
        .lux-slide-out-next,
        .lux-slide-out-prev {
          animation:
            lux-slide-out-fade ${SLIDE_OUT_MS}ms linear forwards,
            lux-slide-out-move-next ${SLIDE_OUT_MS}ms ${SLIDE_EASE} forwards;
          z-index: 2;
          backface-visibility: hidden;
        }
        .lux-slide-out-prev {
          animation-name: lux-slide-out-fade, lux-slide-out-move-prev;
        }
        .lux-slide-in-next,
        .lux-slide-in-prev {
          animation:
            lux-slide-in-fade ${SLIDE_IN_MS}ms ease-out forwards,
            lux-slide-in-move-next ${SLIDE_IN_MS}ms ${SLIDE_EASE} forwards;
          animation-delay: ${SLIDE_IN_DELAY_MS}ms;
          z-index: 1;
          backface-visibility: hidden;
        }
        .lux-slide-in-prev {
          animation-name: lux-slide-in-fade, lux-slide-in-move-prev;
        }
      `}</style>

      <section
        ref={sectionRef}
        className="bg-background relative w-full overflow-hidden select-none"
        style={{ minHeight: HERO_MIN_H }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Ana tanıtım alanı"
        onPointerMove={handlePointerMove}
      >
        {/* ── Görseller ── */}
        {slides.map((s, i) => {
          const isVideo = s.mimeType?.startsWith('video/') ?? false
          const alt = s.imageAlt || s.title
          const tr = slideTransition
          const isIdleActive = !tr && i === active
          const isOutgoing = tr !== null && i === tr.from
          const isIncoming = tr !== null && i === tr.to
          const isVisible = isIdleActive || isOutgoing || isIncoming

          const slideAnimClass = isOutgoing
            ? tr.direction === 1
              ? 'lux-slide-out-next'
              : 'lux-slide-out-prev'
            : isIncoming
              ? tr.direction === 1
                ? 'lux-slide-in-next'
                : 'lux-slide-in-prev'
              : ''

          return (
            <div
              key={s.id}
              className={cn(
                'absolute inset-0 overflow-hidden will-change-[transform,opacity] [transform:translateZ(0)]',
                slideAnimClass
              )}
              style={{
                opacity: isVisible ? 1 : 0,
                pointerEvents: isIdleActive ? 'auto' : 'none',
                zIndex: isOutgoing ? 2 : isIncoming ? 1 : isIdleActive ? 1 : 0,
              }}
              aria-hidden={!isVisible}
            >
              {isVideo ? (
                <video
                  title={alt}
                  src={s.mediaSrc}
                  className="absolute inset-0 size-full object-cover brightness-[0.4] dark:brightness-[0.3]"
                  muted
                  playsInline
                  preload={i < 2 ? 'auto' : 'metadata'}
                />
              ) : (
                <Image
                  src={s.mediaSrc}
                  alt={alt}
                  fill
                  priority={i < 3}
                  unoptimized
                  className="object-cover brightness-[0.4] dark:brightness-[0.3]"
                  sizes="100vw"
                />
              )}
            </div>
          )
        })}

        {/* Gradient örtüsü */}
        <div
          className="absolute inset-0 z-[2] bg-gradient-to-t from-background via-background/50 to-background/5"
          aria-hidden
        />

        {/* ── İçerik ── */}
        <div className="relative z-[3] flex min-h-[min(88vh,720px)] flex-col justify-end px-6 pb-24 pt-20 sm:px-12 sm:pb-28">
          <FadeReveal
            key={`counter-${animKey}`}
            text={`0${active + 1} / 0${slideCount}`}
            animKey={animKey}
            delay={80}
            className="lux-counter text-foreground/35 mb-6 block font-mono text-[11px]"
            reduceMotion={reduceMotion ?? false}
            as="span"
          />

          {slide.subtitle && (
            <FadeReveal
              key={`sub-${animKey}`}
              text={(
                slide.subtitle.split('.')[0]?.trim() ?? slide.subtitle
              ).toUpperCase()}
              animKey={animKey}
              delay={180}
              className="text-foreground/55 mb-3 block text-[10px] font-medium tracking-[0.3em]"
              reduceMotion={reduceMotion ?? false}
              as="span"
            />
          )}

          <FadeReveal
            key={`title-${animKey}`}
            text={slide.title}
            animKey={animKey}
            delay={280}
            className="text-foreground block max-w-2xl text-3xl font-light tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            reduceMotion={reduceMotion ?? false}
            as="h2"
          />

          {slide.subtitle && slide.subtitle.length > 40 && (
            <FadeReveal
              key={`desc-${animKey}`}
              text={slide.subtitle}
              animKey={animKey}
              delay={400}
              className="text-foreground/60 mt-4 block max-w-lg text-sm font-light leading-loose"
              reduceMotion={reduceMotion ?? false}
              as="p"
            />
          )}

          <div
            className="lux-fade mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: '520ms' }}
            key={`cta-${animKey}`}
          >
            {slide.showPrimaryButton &&
            slide.primaryHref &&
            slide.primaryLabel ? (
              <Button
                asChild
                size="lg"
                className="bg-foreground text-background rounded-none px-8 font-light tracking-widest text-xs uppercase hover:bg-foreground/90"
              >
                <Link href={slide.primaryHref}>{slide.primaryLabel}</Link>
              </Button>
            ) : null}
            {slide.showSecondaryButton &&
            slide.secondaryHref &&
            slide.secondaryLabel ? (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-foreground/70 hover:text-foreground rounded-none border-0 px-0 font-light tracking-widest text-xs uppercase underline-offset-4 hover:underline hover:bg-transparent"
              >
                <Link href={slide.secondaryHref}>{slide.secondaryLabel}</Link>
              </Button>
            ) : null}
          </div>

          {slideCount > 1 && (
            <div
              className="lux-fade mt-10 flex items-center gap-3"
              style={{ animationDelay: '600ms' }}
              key={`nav-${animKey}`}
              role="group"
              aria-label="Slayt navigasyonu"
            >
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}. slayta geç`}
                  aria-current={i === active ? 'true' : undefined}
                  className={cn(
                    'lux-nav-line h-[1px] rounded-full bg-foreground',
                    i === active ? 'lux-nav-active' : 'lux-nav-inactive'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Long press göstergesi ── */}
        {slideCount > 1 && (
          <LongPressIndicator
            progress={progress}
            pressing={pressing}
            direction={pressing ? longPressDirection : hoverSide}
          />
        )}

        {slideCount > 1 ? (
          <HeroNavArrows
            onPrev={goPrev}
            onNext={goNext}
            prevDisabled={navDisabled}
            nextDisabled={navDisabled}
            className="z-[7] px-3 sm:px-5"
          />
        ) : null}
      </section>
    </>
  )
}
