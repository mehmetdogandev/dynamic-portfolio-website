'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import { HERO_MIN_H, wrapSlideIndex } from './hero-shared'

// ─── Animasyon varyantları ───────────────────────────────────────────────────

/**
 * scale variants'tan çıkarıldı — clipPath ile aynı motion.div'de
 * birlikte kullanılınca bazı FM versiyonlarında çakışıyor.
 * scale artık iç wrapper'ın style'ında sabit duruyor,
 * animate ile ayrı motion.div üzerinden yönetiliyor.
 */
const mediaVariants: Variants = {
  enter: {
    opacity: 0,
    clipPath: 'inset(0% 50% 0% 50%)',
  },
  center: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: {
      clipPath: { duration: 1.1, ease: [0.76, 0, 0.24, 1] },
      opacity: { duration: 0.6, ease: 'easeOut' },
    },
  },
  exit: {
    opacity: 0,
    clipPath: 'inset(0% 0% 0% 100%)',
    transition: {
      clipPath: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
      opacity: { duration: 0.4, ease: 'easeIn' },
    },
  },
}

/**
 * scale ayrı motion.div'de animate ediliyor — çakışma riski yok.
 */
const scaleVariants: Variants = {
  enter: { scale: 1.06 },
  center: {
    scale: 1,
    transition: { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    scale: 0.97,
    transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] },
  },
}

const overlayVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeIn' } },
}

const textContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.35 },
  },
  exit: {
    transition: { staggerChildren: 0.06, staggerDirection: -1 },
  },
}

const textItemVariants: Variants = {
  hidden: { opacity: 0, x: -40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -20,
    filter: 'blur(2px)',
    transition: { duration: 0.3, ease: 'easeIn' },
  },
}

// ─── Slide içerik bileşeni ───────────────────────────────────────────────────

function SlideContent({
  slide,
  isFirst,
  reduceMotion,
  springX,
  springY,
}: {
  slide: WebsiteHeroSlide
  isFirst: boolean
  reduceMotion: boolean | null
  springX: MotionValue<number>
  springY: MotionValue<number>
}) {
  const isVideo = slide.mimeType?.startsWith('video/') ?? false
  const alt = slide.imageAlt || slide.title

  // Metin: zıt yönde ~8x daha az hareket — derinlik hissi
  const textX = useTransform(springX, (v) => -v / 8)
  const textY = useTransform(springY, (v) => -v / 8)

  return (
    <>
      {/*
        Katman 1 — clipPath + opacity geçişi (scale YOK burada)
        overflow-hidden: clipPath animasyonu sırasında dışarı taşmayı önler
      */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        variants={reduceMotion ? undefined : mediaVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {/*
          Katman 2 — scale geçişi + mouse parallax
          scale(1.08): ±20px mouse hareketi kenar boşluğu oluşturmasın diye
        */}
        <motion.div
          className="absolute inset-0"
          variants={reduceMotion ? undefined : scaleVariants}
          initial="enter"
          animate="center"
          exit="exit"
          style={
            reduceMotion
              ? { scale: 1.08 }
              : { x: springX, y: springY, scale: 1.08 }
          }
        >
          {isVideo ? (
            <video
              title={alt}
              src={slide.mediaSrc}
              className="absolute inset-0 size-full object-cover dark:brightness-[0.85]"
              muted
              playsInline
              preload="metadata"
              autoPlay
              loop
            />
          ) : (
            <Image
              src={slide.mediaSrc}
              alt={alt}
              fill
              priority={isFirst}
              unoptimized
              className="object-cover dark:brightness-[0.85]"
              sizes="100vw"
            />
          )}
        </motion.div>
      </motion.div>

      {/* Overlay gradyanı */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/15 dark:from-background dark:via-background/90"
        variants={reduceMotion ? undefined : overlayVariants}
        initial="enter"
        animate="center"
        exit="exit"
        aria-hidden
      />

      {/* Metin: soldan giriş + hafif zıt parallax */}
      <div className="relative z-[1] mx-auto flex min-h-[min(88vh,720px)] max-w-7xl flex-col justify-end px-4 pb-28 pt-24 sm:px-6 sm:pb-32 sm:pt-28">
        {/* Parallax wrapper */}
        <motion.div style={reduceMotion ? undefined : { x: textX, y: textY }}>
          <motion.div
            className="max-w-2xl"
            variants={reduceMotion ? undefined : textContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Başlık */}
            <motion.p
              className={cn(
                'text-primary font-serif font-semibold leading-[1.1] tracking-tight',
                isFirst
                  ? 'text-4xl sm:text-5xl md:text-[3.25rem]'
                  : 'text-3xl sm:text-4xl md:text-[2.75rem]'
              )}
              variants={reduceMotion ? undefined : textItemVariants}
            >
              {slide.title}
            </motion.p>

            {/* Subtitle */}
            {slide.subtitle ? (
              <motion.p
                className="text-foreground/90 mt-4 max-w-xl text-base leading-relaxed sm:text-lg"
                variants={reduceMotion ? undefined : textItemVariants}
              >
                {slide.subtitle}
              </motion.p>
            ) : null}

            {/* Butonlar */}
            {(slide.showPrimaryButton &&
              slide.primaryHref &&
              slide.primaryLabel) ||
            (slide.showSecondaryButton &&
              slide.secondaryHref &&
              slide.secondaryLabel) ? (
              <motion.div
                className="mt-8 flex flex-wrap items-center gap-3"
                variants={reduceMotion ? undefined : textItemVariants}
              >
                {slide.showPrimaryButton &&
                slide.primaryHref &&
                slide.primaryLabel ? (
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
                    <Link href={slide.secondaryHref}>
                      {slide.secondaryLabel}
                    </Link>
                  </Button>
                ) : null}
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export function WebsiteHeroDefault({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const reduceMotion = useReducedMotion()
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slideCount = slides.length
  const carouselId = 'website-hero-default-carousel'
  const slideIdPrefix = 'website-hero-default-slide'
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Mouse parallax — MinimalDots ile aynı pattern
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 18 })

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x * 20) // ±10px — orta yoğunluk
    mouseY.set(y * 20)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const goTo = useCallback(
    (index: number) => {
      setActive(wrapSlideIndex(index, slideCount))
    },
    [slideCount]
  )

  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])
  const goNext = useCallback(() => goTo(active + 1), [active, goTo])

  // Klavye navigasyonu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (
        t instanceof HTMLElement &&
        t.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
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
  }, [goPrev, goNext])

  // Autoplay
  useEffect(() => {
    if (slideCount <= 1) return
    autoplayRef.current = setInterval(() => {
      setActive((prev) => (prev + 1 >= slideCount ? 0 : prev + 1))
    }, autoplayMs)
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [autoplayMs, slideCount])

  if (slideCount === 0) return null

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden"
      style={{ minHeight: HERO_MIN_H }}
      aria-roledescription="carousel"
      role="region"
      aria-label="Ana tanıtım alanı"
      id={carouselId}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={slides[active].id}
          id={`${slideIdPrefix}-${active}`}
          role="group"
          aria-roledescription="slayt"
          aria-label={`${active + 1} / ${slideCount}`}
          className="absolute inset-0"
          style={{ minHeight: HERO_MIN_H }}
        >
          <SlideContent
            slide={slides[active]}
            isFirst={active === 0}
            reduceMotion={reduceMotion}
            springX={springX}
            springY={springY}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dot navigasyon */}
      <nav
        className="border-border/40 bg-background/35 pointer-events-auto absolute bottom-5 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-2 rounded-full border px-2.5 py-1.5 shadow-sm backdrop-blur-sm sm:bottom-7"
        aria-label="Slayt gezinmesi"
        role="group"
      >
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}. slayta geç: ${s.title}`}
            aria-current={i === active ? 'true' : undefined}
            className={cn(
              'h-2.5 w-2.5 shrink-0 rounded-full border transition-all duration-300',
              i === active
                ? 'border-primary bg-primary scale-110 shadow-sm'
                : 'border-foreground/20 bg-foreground/30 hover:bg-foreground/50'
            )}
          />
        ))}
      </nav>

      {/* Ok butonları */}
      <button
        type="button"
        onClick={goPrev}
        disabled={slideCount <= 1}
        className="text-foreground/90 hover:text-foreground pointer-events-auto absolute top-1/2 left-3 z-[4] -translate-y-1/2 transition-opacity disabled:opacity-30 sm:left-4"
        aria-label="Önceki slayt"
      >
        <ChevronLeft className="size-9 drop-shadow-md" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={slideCount <= 1}
        className="text-foreground/90 hover:text-foreground pointer-events-auto absolute top-1/2 right-3 z-[4] -translate-y-1/2 transition-opacity disabled:opacity-30 sm:right-4"
        aria-label="Sonraki slayt"
      >
        <ChevronRight className="size-9 drop-shadow-md" strokeWidth={1.75} />
      </button>
    </section>
  )
}
