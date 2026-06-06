'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
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

// ─── Animasyon varyantları ───────────────────────────────────────────────────

/**
 * GÖRSEL — "Curtain" (perde) efekti.
 * Giren görsel yukarıdan aşağıya perde gibi açılıyor.
 * Çıkan görsel sağa doğru sıyrılarak gidiyor.
 * Hafif skewX ile dinamizm katılıyor.
 */
const curtainVariants: Variants = {
  enter: {
    clipPath: 'inset(0% 0% 100% 0%)', // tamamen kapalı — yukarıdan
    skewX: -2,
  },
  center: {
    clipPath: 'inset(0% 0% 0% 0%)', // tam açık
    skewX: 0,
    transition: {
      clipPath: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
      skewX: { duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  },
  exit: {
    clipPath: 'inset(0% 0% 0% 100%)', // sağa doğru sıyrılıyor
    skewX: 1,
    transition: {
      clipPath: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
      skewX: { duration: 0.5, ease: 'easeIn' },
    },
  },
}

/**
 * Overlay gradyanı — görsel açılırken solma efekti.
 */
const overlayVariants: Variants = {
  enter: { opacity: 0.6 },
  center: { opacity: 0, transition: { duration: 1.0, ease: 'easeOut' } },
  exit: { opacity: 0.4, transition: { duration: 0.4, ease: 'easeIn' } },
}

/**
 * METİN CONTAINER — stagger için parent.
 * Her kelime çocuk olarak sırayla animate ediliyor.
 */
const titleContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.3 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

/**
 * Her KELİME aşağıdan yukarıya fırlıyor + blur açılıyor.
 * "clip" efekti: overflow-hidden parent içinde y: 40 → 0 hareketi
 * kelimenin alttan geliyormuş gibi görünmesini sağlıyor.
 */
const wordVariants: Variants = {
  hidden: {
    y: 48,
    opacity: 0,
    rotateX: 25,
    filter: 'blur(6px)',
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    y: -24,
    opacity: 0,
    filter: 'blur(3px)',
    transition: { duration: 0.25, ease: 'easeIn' },
  },
}

/**
 * SUBTITLE — tek parça, soldan kayarak giriyor.
 */
const subtitleVariants: Variants = {
  hidden: { opacity: 0, x: -24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

/**
 * BUTONLAR — subtitle'dan sonra fade + scale ile giriyor.
 */
const ctaVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, delay: 0.75, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// ─── Yardımcı: başlığı kelimelere böl ───────────────────────────────────────

function AnimatedTitle({
  title,
  reduceMotion,
  className,
}: {
  title: string
  reduceMotion: boolean | null
  className?: string
}) {
  const words = title.split(' ')

  if (reduceMotion) {
    return <h2 className={className}>{title}</h2>
  }

  return (
    <motion.h2
      className={cn('flex flex-wrap gap-x-[0.3em]', className)}
      variants={titleContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      // perspective: rotateX efektinin 3D görünmesi için
      style={{ perspective: 800 }}
    >
      {words.map((word, i) => (
        /*
          Her kelime overflow-hidden bir kutu içinde —
          böylece y: 48 → 0 hareketi "alttan fırlıyor" gibi görünür,
          dışarıya taşmaz.
        */
        <span key={`${word}-${i}`} className="overflow-hidden pb-[0.1em]">
          <motion.span className="inline-block" variants={wordVariants}>
            {word}
          </motion.span>
        </span>
      ))}
    </motion.h2>
  )
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function WebsiteHeroSplitLeft({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const sectionId = 'website-hero-split-left'
  const mediaId = 'website-hero-split-left-media'
  const reduceMotion = useReducedMotion()
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slide = slides[active]!

  const goTo = useCallback(
    (i: number) => setActive(wrapSlideIndex(i, count)),
    [count]
  )
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  useHeroKeyboard({ slideCount: count, goPrev, goNext })

  useEffect(() => {
    if (count <= 1) return
    const timer = window.setInterval(() => {
      setActive((prev) => (prev + 1) % count)
    }, autoplayMs)
    return () => window.clearInterval(timer)
  }, [autoplayMs, count])

  if (count === 0) return null

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: HERO_MIN_H }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ana tanıtım alanı"
      id={sectionId}
    >
      <div
        className="mx-auto flex min-h-[min(88vh,720px)] max-w-7xl flex-col md:flex-row"
        role="group"
        aria-roledescription="slayt"
        aria-label={`${active + 1} / ${count}`}
      >
        {/* ── Sol panel: metin ── */}
        <div className="flex w-full flex-col justify-center gap-2 px-5 py-10 md:w-1/2 md:pr-6 md:pl-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              className="max-w-xl"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Başlık — kelime kelime fırlıyor */}
              <AnimatedTitle
                title={slide.title}
                reduceMotion={reduceMotion}
                className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.4rem] leading-tight"
              />

              {/* Subtitle */}
              {slide.subtitle ? (
                <motion.p
                  className="text-foreground/85 mt-3 text-base leading-relaxed sm:text-lg"
                  variants={reduceMotion ? undefined : subtitleVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {slide.subtitle}
                </motion.p>
              ) : null}

              {/* Butonlar */}
              <motion.div
                variants={reduceMotion ? undefined : ctaVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <HeroSlideCtas slide={slide} />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Sağ panel: görsel — curtain efekti ── */}
        <div
          className="relative h-[min(50vh,420px)] w-full min-h-0 md:h-auto md:min-h-[min(88vh,720px)] md:w-1/2"
          id={mediaId}
        >
          <div className="bg-muted relative size-full min-h-[280px] md:min-h-full overflow-hidden">
            <AnimatePresence mode="sync">
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                variants={reduceMotion ? undefined : curtainVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <HeroSlideMedia slide={slide} priority={active === 0} />

                {/* Overlay: görsel açılırken solma efekti */}
                <motion.div
                  className="from-background/30 pointer-events-none absolute inset-0 bg-gradient-to-l to-transparent"
                  variants={reduceMotion ? undefined : overlayVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  aria-hidden
                />
              </motion.div>
            </AnimatePresence>

            {/* Sabit sol kenar gradyanı */}
            <div
              className="from-background/10 pointer-events-none absolute inset-0 bg-gradient-to-l to-transparent z-[1]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Dot navigasyon */}
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
                'h-2 w-2 rounded-full transition-all duration-300',
                i === active
                  ? 'bg-primary w-4'
                  : 'bg-foreground/25 hover:bg-foreground/45'
              )}
              aria-label={`${i + 1}. slayt: ${s.title}`}
              aria-current={i === active ? 'true' : undefined}
            />
          ))}
        </nav>
      ) : null}

      {/* Ok butonları */}
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
