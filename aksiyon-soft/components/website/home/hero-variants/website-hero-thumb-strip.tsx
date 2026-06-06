'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import {
  HERO_MIN_H,
  HeroNavArrows,
  HeroSlideCtas,
  HeroSlideMedia,
  useHeroKeyboard,
  wrapSlideIndex,
} from './hero-shared'

// ─── Zamanlama ────────────────────────────────────────────────────────────────
const SLAT_COUNT = 10 // jaluzi şerit sayısı
const SLAT_DURATION = 320 // ms — tek şeridin kapanma/açılma süresi
const SLAT_STAGGER = 38 // ms — şeritler arası gecikme
const SWAP_AT = (SLAT_COUNT * SLAT_STAGGER + SLAT_DURATION) / 2 // görsel değişim anı
const TOTAL_DURATION = SLAT_COUNT * SLAT_STAGGER + SLAT_DURATION + 80

// ─── Jaluzi Overlay ───────────────────────────────────────────────────────────
// Her şerit scaleY 0→1→0 animasyonu yapar; ortadan dolar, ortadan açılır.
// "phase: in"  → şeritler kapanır (yeni görsel hazır hale gelir arkada)
// "phase: out" → şeritler açılır (yeni görsel ortaya çıkar)

type JaluziPhase = 'idle' | 'in' | 'out'

function JaluziOverlay({
  phase,
  onMidpoint,
  onDone,
}: {
  phase: JaluziPhase
  onMidpoint: () => void
  onDone: () => void
}) {
  const midCalled = useRef(false)
  const doneCalled = useRef(false)

  useEffect(() => {
    if (phase === 'idle') {
      midCalled.current = false
      doneCalled.current = false
      return
    }

    midCalled.current = false
    doneCalled.current = false

    const t1 = setTimeout(() => {
      if (!midCalled.current) {
        midCalled.current = true
        onMidpoint()
      }
    }, SWAP_AT)

    const t2 = setTimeout(() => {
      if (!doneCalled.current) {
        doneCalled.current = true
        onDone()
      }
    }, TOTAL_DURATION)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [phase, onMidpoint, onDone])

  if (phase === 'idle') return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
      {Array.from({ length: SLAT_COUNT }).map((_, i) => {
        const delay = i * SLAT_STAGGER
        const height = `${100 / SLAT_COUNT}%`
        const top = `${(i / SLAT_COUNT) * 100}%`

        // "in": scaleY 0 → 1, "out": scaleY 1 → 0
        const animation =
          phase === 'in'
            ? `jaluzi-close ${SLAT_DURATION}ms cubic-bezier(0.4,0,0.2,1) ${delay}ms both`
            : `jaluzi-open ${SLAT_DURATION}ms cubic-bezier(0.4,0,0.6,1) ${delay}ms both`

        return (
          <div
            key={i}
            className="absolute left-0 right-0 origin-center"
            style={{
              top,
              height,
              animation,
              // Şerit rengi: arka plan tonuyla uyumlu, hafif cam efekti
              background: 'hsl(var(--background) / 0.96)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function WebsiteHeroThumbStrip({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const [jaluziPhase, setJaluziPhase] = useState<JaluziPhase>('idle')
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const isAnimating = useRef(false)

  const sectionId = 'website-hero-thumb-strip'
  const reduceMotion = useReducedMotion()
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slide = slides[active]!

  // ── Geçiş ──────────────────────────────────────────────────────────────────
  const performTransition = useCallback(
    (target: number) => {
      const wrapped = wrapSlideIndex(target, count)
      if (wrapped === active || isAnimating.current) return

      if (reduceMotion) {
        setActive(wrapped)
        setAnimKey((k) => k + 1)
        return
      }

      isAnimating.current = true
      setPendingIdx(wrapped)
      setJaluziPhase('in')
    },
    [active, count, reduceMotion]
  )

  // Şeritler tam kapandı → görsel değiştir + şeritleri aç
  const handleMidpoint = useCallback(() => {
    if (pendingIdx !== null) {
      setActive(pendingIdx)
      setAnimKey((k) => k + 1)
    }
    setJaluziPhase('out')
  }, [pendingIdx])

  // Animasyon bitti → temizle
  const handleDone = useCallback(() => {
    setJaluziPhase('idle')
    setPendingIdx(null)
    isAnimating.current = false
  }, [])

  const goTo = useCallback(
    (i: number) => performTransition(i),
    [performTransition]
  )
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  useHeroKeyboard({ slideCount: count, goPrev, goNext })

  // ── Autoplay ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (count <= 1) return
    const timer = window.setInterval(() => {
      if (!isAnimating.current) {
        performTransition((active + 1) % count)
      }
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [autoplayMs, count, active, performTransition])

  // ── Text reveal ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (reduceMotion) return
    const section = document.getElementById(sectionId)
    if (!section) return
    const words = section.querySelectorAll<HTMLElement>('.hero-word')
    words.forEach((w) => w.classList.remove('hero-word--in'))
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        words.forEach((w) => w.classList.add('hero-word--in'))
      )
    )
    return () => cancelAnimationFrame(id)
  }, [animKey, reduceMotion])

  if (count === 0) return null

  return (
    <>
      <style>{`
        @keyframes jaluzi-close {
          0%   { transform: scaleY(0); }
          100% { transform: scaleY(1); }
        }
        @keyframes jaluzi-open {
          0%   { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }

        /* Metin kelime animasyonu */
        .hero-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(10px);
          will-change: transform, opacity;
          transition:
            transform 0.65s cubic-bezier(0.22, 1, 0.36, 1),
            opacity   0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .hero-word--in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Thumbnail hover */
        .hero-thumb {
          transition: transform 0.4s cubic-bezier(0.4,0,0.2,1),
                      opacity   0.4s cubic-bezier(0.4,0,0.2,1),
                      box-shadow 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .hero-thumb-active {
          transform: scale(1.06) translateY(-2px);
          box-shadow: 0 0 0 2px hsl(var(--primary)), 0 6px 20px rgba(0,0,0,0.3);
        }
        .hero-thumb-inactive {
          opacity: 0.55;
        }
        .hero-thumb-inactive:hover {
          opacity: 0.85;
          transform: scale(1.03) translateY(-1px);
        }

        /* İnce grain dokusu — lüks his */
        .hero-grain::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 3;
          mix-blend-mode: overlay;
        }
      `}</style>

      <section
        className="relative w-full"
        style={{ minHeight: HERO_MIN_H }}
        role="region"
        aria-label="Ana tanıtım alanı"
        id={sectionId}
      >
        <div
          className="relative min-h-[min(72vh,600px)] w-full overflow-hidden pb-24 md:pb-28"
          role="group"
          aria-roledescription="slayt"
          aria-label={`${active + 1} / ${count}`}
        >
          {/* ── Görsel katmanı ──
              TÜM slide'lar DOM'da mevcut, sadece active olan görünür.
              Bu sayede hiç yükleme gecikmesi olmaz — görsel zaten hazır. */}
          <div className="hero-grain bg-muted relative min-h-[min(72vh,600px)] w-full">
            {slides.map((s, i) => (
              <div
                key={s.id}
                className="absolute inset-0"
                style={{
                  // Görünmez olanlar display:none DEĞİL — tarayıcı görseli yüklü tutsun
                  opacity: i === active ? 1 : 0,
                  // Geçiş animasyonu yok — jaluzi zaten geçişi kapıyor
                  pointerEvents: i === active ? 'auto' : 'none',
                }}
                aria-hidden={i !== active}
              >
                <HeroSlideMedia
                  slide={s}
                  // İlk 3 görsel priority, geri kalanlar lazy ama DOM'da
                  priority={i < 3}
                />
              </div>
            ))}
          </div>

          {/* Alt gradient — metnin arkasında, görsellerin üstünde */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background/90 via-background/35 to-transparent"
            aria-hidden
          />

          <JaluziOverlay
            phase={jaluziPhase}
            onMidpoint={handleMidpoint}
            onDone={handleDone}
          />

          {/* Metin katmanı — küçük önizlemelerin üstünde */}
          <div className="absolute inset-x-0 top-0 bottom-[5.75rem] z-[10] flex flex-col justify-end px-4 pb-4 sm:bottom-[6.25rem] md:px-8">
            <div className="pointer-events-none ml-[5mm] max-w-2xl [&_a]:pointer-events-auto">
              {active === 0 && !reduceMotion ? (
                <RevealOnScroll variant="scaleIn">
                  <WordReveal
                    text={slide.title}
                    animKey={animKey}
                    baseDelay={120}
                    className="text-foreground text-3xl font-semibold tracking-tight drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] sm:text-4xl md:text-5xl"
                    reduceMotion={reduceMotion ?? false}
                  />
                  {slide.subtitle ? (
                    <WordReveal
                      text={slide.subtitle}
                      animKey={animKey}
                      baseDelay={320}
                      className="text-foreground/90 mt-3 block max-w-2xl text-sm leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-base"
                      reduceMotion={reduceMotion ?? false}
                    />
                  ) : null}
                  <HeroSlideCtas slide={slide} />
                </RevealOnScroll>
              ) : (
                <>
                  <WordReveal
                    text={slide.title}
                    animKey={animKey}
                    baseDelay={120}
                    className="text-foreground text-3xl font-semibold tracking-tight drop-shadow-[0_1px_12px_rgba(0,0,0,0.35)] sm:text-4xl"
                    reduceMotion={reduceMotion ?? false}
                  />
                  {slide.subtitle ? (
                    <WordReveal
                      text={slide.subtitle}
                      animKey={animKey}
                      baseDelay={320}
                      className="text-foreground/90 mt-3 block text-sm drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-base"
                      reduceMotion={reduceMotion ?? false}
                    />
                  ) : null}
                  <HeroSlideCtas slide={slide} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Küçük önizleme şeridi */}
        <div
          className="border-border/30 bg-background/55 absolute right-0 bottom-[5mm] left-0 z-[2] border-t px-2 py-3 backdrop-blur-xl"
          role="group"
          aria-label="Küçük önizlemeler"
        >
          <div className="mx-auto flex max-w-5xl gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'hero-thumb relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border sm:h-14 sm:w-24',
                  i === active
                    ? 'hero-thumb-active border-primary/70'
                    : 'hero-thumb-inactive border-border/20'
                )}
                aria-label={`${i + 1}. slayta geç: ${s.title}`}
              >
                <div className="bg-muted relative h-full w-full">
                  <HeroSlideMedia slide={s} priority={i < 2} sizes="96px" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Ok navigasyon ── */}
        {count > 1 ? (
          <HeroNavArrows
            onPrev={goPrev}
            onNext={goNext}
            prevDisabled={count <= 1}
            nextDisabled={count <= 1}
            className="z-[12] -translate-y-[calc(50%-2.5rem)]"
          />
        ) : null}
      </section>
    </>
  )
}

// ─── Kelime kelime reveal ──────────────────────────────────────────────────────

function WordReveal({
  text,
  animKey,
  baseDelay,
  className,
  reduceMotion,
}: {
  text: string
  animKey: number
  baseDelay: number
  className?: string
  reduceMotion: boolean
}) {
  if (reduceMotion) return <span className={className}>{text}</span>

  const words = text.split(' ')
  return (
    <span className={cn('block', className)}>
      {words.map((word, i) => (
        <span
          key={`${animKey}-${i}`}
          className="hero-word"
          style={{ transitionDelay: `${baseDelay + i * 32}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}
