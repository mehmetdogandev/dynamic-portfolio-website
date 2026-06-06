'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import {
  HERO_MIN_H,
  HeroSlideCtas,
  HeroSlideMedia,
  useHeroKeyboard,
  wrapSlideIndex,
} from './hero-shared'

export function WebsiteHeroMinimalDots({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const sectionId = 'website-hero-minimal-dots'
  const reduceMotion = useReducedMotion()
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const slide = slides[active]!

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 60, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 18 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    mouseX.set(x * 85)
    mouseY.set(y * 85)
  }

  const goTo = useCallback(
    (i: number) => {
      setActive(wrapSlideIndex(i, count))
    },
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
      onMouseMove={handleMouseMove}
      className="bg-background relative w-full overflow-hidden"
      style={{ minHeight: HERO_MIN_H }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ana tanıtım alanı"
      id={sectionId}
    >
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="relative h-full w-full min-h-[min(88vh,720px)]"
            style={{
              x: springX,
              y: springY,
              scale: 1.08,
              opacity: 0.45,
            }}
            initial={{ opacity: 0, scale: 1.2, filter: 'blur(12px)', x: 40 }}
            animate={{ opacity: 0.45, scale: 1, filter: 'blur(0px)', x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -40, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <HeroSlideMedia
              slide={slide}
              priority={active === 0}
              className="scale-105 object-cover"
              videoClassName="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        <div className="from-background/60 via-background/30 to-background/70 absolute inset-0 bg-gradient-to-b" />
      </div>

      {/* CONTENT */}
      <div className="relative z-[1] flex min-h-[min(88vh,720px)] w-full items-center justify-center px-4 py-20 text-center">
        {active === 0 && !reduceMotion ? (
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 80, rotateX: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ transformPerspective: 1000 }}
          >
            <h2 className="text-foreground text-3xl font-medium tracking-tight sm:text-5xl md:text-6xl">
              {slide.title}
            </h2>

            {slide.subtitle ? (
              <motion.p
                className="text-foreground/75 mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {slide.subtitle}
              </motion.p>
            ) : null}

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <HeroSlideCtas slide={slide} className="justify-center" />
            </motion.div>
          </motion.div>
        ) : (
          <div className="max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-medium tracking-tight sm:text-5xl md:text-5xl">
              {slide.title}
            </h2>
            {slide.subtitle ? (
              <p className="text-foreground/75 mx-auto mt-4 max-w-xl text-sm sm:text-base">
                {slide.subtitle}
              </p>
            ) : null}
            <HeroSlideCtas slide={slide} className="justify-center" />
          </div>
        )}
      </div>

      {/* DOTS */}
      {count > 1 && (
        <nav className="absolute right-0 bottom-10 left-0 z-[2] flex justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'h-2.5 w-2.5 rounded-full border border-foreground/15 transition',
                i === active
                  ? 'bg-foreground w-6'
                  : 'bg-foreground/25 hover:bg-foreground/45'
              )}
            />
          ))}
        </nav>
      )}
    </section>
  )
}
