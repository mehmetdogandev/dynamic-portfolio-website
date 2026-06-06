'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
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

// ─── Ink blob path üretici ───────────────────────────────────────────────────

function generateInkPath(progress: number): string {
  const p = Math.max(0, Math.min(1, progress))
  const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2

  const cx = 100 * ease
  const spread = 60 * ease
  const pts: { x: number; y: number }[] = []

  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const angle = t * Math.PI * 2
    const wobble =
      Math.sin(angle * 3) * 8 * ease + Math.cos(angle * 5) * 5 * ease
    const r = spread + wobble
    pts.push({ x: cx + Math.cos(angle) * r * 1.4, y: 50 + Math.sin(angle) * r })
  }

  if (pts.length === 0) return 'M0,0'

  let d = `M${pts[0]!.x},${pts[0]!.y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!
    const curr = pts[i]!
    d += ` Q${prev.x},${prev.y} ${(prev.x + curr.x) / 2},${(prev.y + curr.y) / 2}`
  }
  return d + ' Z'
}

function runInkTransition(
  pathEl: SVGPathElement,
  onMidpoint: () => void,
  duration = 900
): void {
  const start = performance.now()
  let midFired = false

  function tick(now: number) {
    const t = Math.min((now - start) / duration, 1)

    if (t < 0.5) {
      pathEl.setAttribute('d', generateInkPath(t / 0.5))
    } else {
      if (!midFired) {
        midFired = true
        onMidpoint()
      }
      pathEl.setAttribute('d', generateInkPath(1 - (t - 0.5) / 0.5))
    }

    if (t < 1) {
      requestAnimationFrame(tick)
    } else {
      pathEl.setAttribute('d', '')
    }
  }

  requestAnimationFrame(tick)
}

// ─── Word stagger yardımcısı ─────────────────────────────────────────────────

function WordStagger({
  text,
  className,
  wordClassName,
  baseDelay = 0,
  stagger = 60,
}: {
  text: string
  className?: string
  wordClassName: string
  baseDelay?: number
  stagger?: number
}) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={wordClassName}
          style={{ transitionDelay: `${baseDelay + i * stagger}ms` }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  )
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function WebsiteHeroSplitRight({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const inkPathRef = useRef<SVGPathElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const sectionId = 'website-hero-split-right'

  const reduceMotion = useReducedMotion()
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slide = slides[active]!

  // ── Geçiş mantığı ──────────────────────────────────────────────────────────

  const performTransition = useCallback(
    (next: number) => {
      if (next === active || isTransitioning) return

      if (reduceMotion || !inkPathRef.current) {
        setActive(next)
        setAnimKey((k) => k + 1)
        return
      }

      setIsTransitioning(true)
      runInkTransition(
        inkPathRef.current,
        () => {
          setActive(next)
          setAnimKey((k) => k + 1)
        },
        900
      )
      setTimeout(() => setIsTransitioning(false), 960)
    },
    [active, isTransitioning, reduceMotion]
  )

  const goTo = useCallback(
    (i: number) => performTransition(wrapSlideIndex(i, count)),
    [count, performTransition]
  )

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  useHeroKeyboard({ slideCount: count, goPrev, goNext })

  // ── Autoplay ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (count <= 1) return
    const timer = window.setInterval(() => {
      if (!isTransitioning) {
        setActive((prev) => {
          const next = (prev + 1) % count
          if (!reduceMotion && inkPathRef.current) {
            setIsTransitioning(true)
            runInkTransition(
              inkPathRef.current,
              () => {
                setActive(next)
                setAnimKey((k) => k + 1)
              },
              900
            )
            setTimeout(() => setIsTransitioning(false), 960)
            return prev
          }
          setAnimKey((k) => k + 1)
          return next
        })
      }
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [autoplayMs, count, isTransitioning, reduceMotion])

  // ── Parallax mouse ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (reduceMotion) return
    const section = document.getElementById(sectionId)
    if (!section) return

    const onMove = (e: MouseEvent) => {
      if (!bgRef.current) return
      const rect = section.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 9
      bgRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.07)`
    }

    const onLeave = () => {
      if (bgRef.current) {
        bgRef.current.style.transform = 'translate(0px, 0px) scale(1.07)'
      }
    }

    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [reduceMotion])

  // ── Word stagger tetikleyici ───────────────────────────────────────────────

  useEffect(() => {
    if (reduceMotion) return
    const section = document.getElementById(sectionId)
    if (!section) return

    const words = section.querySelectorAll<HTMLElement>(
      '.hero-word, .hero-sub-word'
    )
    words.forEach((w) =>
      w.classList.remove('hero-word--visible', 'hero-sub-word--visible')
    )

    const id = requestAnimationFrame(() => {
      words.forEach((w) => {
        if (w.classList.contains('hero-word')) {
          w.classList.add('hero-word--visible')
        } else {
          w.classList.add('hero-sub-word--visible')
        }
      })
    })
    return () => cancelAnimationFrame(id)
  }, [animKey, reduceMotion])

  if (count === 0) return null

  return (
    <>
      {/* ── Global animasyon stilleri ── */}
      <style>{`
        .hero-word {
          display: inline-block;
          transform: translateY(115%) rotate(2deg);
          opacity: 0;
          will-change: transform, opacity;
          transition:
            transform 0.65s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.5s ease;
        }
        .hero-word--visible {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        .hero-sub-word {
          display: inline-block;
          transform: translateY(70%) skewY(5deg);
          opacity: 0;
          will-change: transform, opacity;
          transition:
            transform 0.55s cubic-bezier(0.16, 1, 0.3, 1),
            opacity 0.45s ease;
        }
        .hero-sub-word--visible {
          transform: translateY(0) skewY(0deg);
          opacity: 1;
        }
        .hero-slide-bg {
          will-change: transform;
          transition: transform 0.12s ease-out;
        }
        @keyframes hero-ray-pulse {
          0%, 100% { opacity: 0; height: 0; }
          50%       { opacity: 1; height: 100%; }
        }
        .hero-light-ray {
          position: absolute;
          top: 0;
          width: 1px;
          transform-origin: top center;
          pointer-events: none;
          animation: hero-ray-pulse ease-in-out infinite;
        }
      `}</style>

      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: HERO_MIN_H }}
        role="region"
        aria-label="Ana tanıtım alanı"
        id={sectionId}
      >
        <div
          className="mx-auto flex min-h-[min(88vh,720px)] max-w-7xl flex-col-reverse md:flex-row"
          role="group"
          aria-roledescription="slayt"
          aria-label={`${active + 1} / ${count}`}
        >
          {/* ── GÖRSEL TARAF ── */}
          <div className="relative h-[min(50vh,420px)] w-full min-h-0 md:h-auto md:min-h-[min(88vh,720px)] md:w-1/2 overflow-hidden">
            {/* Paralaks arka plan */}
            <div
              ref={bgRef}
              className="bg-muted hero-slide-bg absolute inset-0 min-h-[280px] md:min-h-full"
              style={{ transform: 'scale(1.07)' }}
            >
              <HeroSlideMedia slide={slide} priority={active === 0} />
            </div>

            {/* Işık huzmeleri */}
            {!reduceMotion && (
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden"
                aria-hidden
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="hero-light-ray"
                    style={{
                      left: `${15 + i * 14}%`,
                      transform: `rotate(${-12 + i * 4.5}deg)`,
                      background:
                        'linear-gradient(to bottom, rgba(255,255,255,0.07), transparent)',
                      width: `${1 + (i % 2) * 1.5}px`,
                      animationDelay: `${i * 0.65}s`,
                      animationDuration: `${3.2 + i * 0.45}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Ink wash geçiş overlay */}
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <defs>
                <clipPath id="hero-ink-clip">
                  <path ref={inkPathRef} d="" />
                </clipPath>
              </defs>
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                className="fill-background"
                clipPath="url(#hero-ink-clip)"
              />
            </svg>

            <div
              className="to-background/10 pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent"
              aria-hidden
            />
          </div>

          {/* ── METİN TARAF ── */}
          <div className="flex w-full flex-col justify-center gap-2 px-5 py-10 text-right md:w-1/2 md:pl-6 md:pr-8">
            <div className="ml-auto max-w-xl text-right">
              <h2 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.4rem] overflow-hidden">
                {reduceMotion ? (
                  slide.title
                ) : (
                  <WordStagger
                    key={`title-${animKey}`}
                    text={slide.title}
                    wordClassName="hero-word"
                    baseDelay={0}
                    stagger={65}
                  />
                )}
              </h2>

              {slide.subtitle ? (
                <p className="text-foreground/85 mt-3 text-base leading-relaxed sm:text-lg overflow-hidden">
                  {reduceMotion ? (
                    slide.subtitle
                  ) : (
                    <WordStagger
                      key={`sub-${animKey}`}
                      text={slide.subtitle}
                      wordClassName="hero-sub-word"
                      baseDelay={220}
                      stagger={45}
                    />
                  )}
                </p>
              ) : null}

              <HeroSlideCtas
                slide={slide}
                className="ml-auto mt-6 justify-end sm:mt-8"
              />
            </div>
          </div>
        </div>

        {/* ── Nav dots ── */}
        {count > 1 ? (
          <nav
            className="border-border/30 bg-background/30 absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2 py-1.5 backdrop-blur-sm"
            aria-label="Slayt gezinmesi"
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === active
                    ? 'bg-primary w-4'
                    : 'bg-foreground/25 hover:bg-foreground/45 w-2'
                )}
                aria-label={`${i + 1}. slayt: ${s.title}`}
                aria-current={i === active ? 'true' : undefined}
              />
            ))}
          </nav>
        ) : null}

        {/* ── Ok navigasyon ── */}
        {count > 1 ? (
          <HeroNavArrows
            onPrev={goPrev}
            onNext={goNext}
            prevDisabled={count <= 1}
            nextDisabled={count <= 1}
          />
        ) : null}
      </section>
    </>
  )
}
