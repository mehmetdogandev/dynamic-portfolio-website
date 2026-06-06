'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { normalizeAutoplayIntervalMs } from '@/lib/website/slider-autoplay'
import type { WebsiteHeroSlide } from '@/lib/website/types'
import { HERO_MIN_H, useHeroKeyboard, wrapSlideIndex } from './hero-shared'

const MAX_LAYERS = 4

export function WebsiteHeroStack({
  slides,
  autoplayInterval,
}: {
  slides: WebsiteHeroSlide[]
  autoplayInterval?: number | null
}) {
  const [active, setActive] = useState(0)
  const count = slides.length
  const autoplayMs = normalizeAutoplayIntervalMs(autoplayInterval)
  const layerCount = Math.min(MAX_LAYERS, count)

  /* 🔥 MOUSE */
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 35, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 35, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    mouseX.set(x * 60)
    mouseY.set(y * 45)
  }

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
      onMouseMove={handleMouseMove}
      className="bg-muted/30 relative w-full overflow-hidden"
      style={{ minHeight: HERO_MIN_H }}
    >
      <div className="relative mx-auto flex min-h-[min(88vh,640px)] w-full max-w-2xl items-center justify-center py-6">
        <AnimatePresence mode="popLayout">
          {Array.from({ length: layerCount }, (_, o) => {
            const i = (active + o) % count
            const s = slides[i]!
            const d = o
            const isFront = d === 0

            return (
              <motion.div
                key={`${s.id}-${d}`}
                className="bg-card border-border/50 absolute w-[min(100%,480px)] overflow-hidden rounded-2xl border shadow-xl"
                style={{
                  x: springX,
                  y: springY,
                  zIndex: 20 - d,
                }}
                /* 🔥 ENTER */
                initial={{
                  opacity: 0,
                  scale: 1.08,
                  y: 40,
                  filter: 'blur(12px)',
                }}
                /* 🔥 ACTIVE */
                animate={{
                  opacity: d === 0 ? 1 : 0.6 - d * 0.1,
                  scale: 1 - d * 0.06,
                  y: d * 16,
                  rotate: d === 0 ? 0 : d === 1 ? -1 : d === 2 ? 1 : -1.5,
                  filter: `blur(${d * 1.5}px)`,
                }}
                /* 🔥 EXIT */
                exit={{
                  opacity: 0,
                  scale: 1.05,
                  y: -30,
                  filter: 'blur(10px)',
                }}
                /* 🔥 SMOOTH CINEMATIC */
                transition={{
                  duration: 0.65,
                  ease: [0.22, 1, 0.36, 1], // ultra smooth cubic bezier
                }}
              >
                <div className="relative h-[min(48vh,400px)] w-full">
                  <Image
                    src={s.mediaSrc}
                    alt={s.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                </div>

                {isFront && (
                  <motion.div
                    key={s.id + '-content'}
                    className="p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h2 className="text-xl font-semibold sm:text-2xl">
                      {s.title}
                    </h2>

                    {s.subtitle && (
                      <p className="text-foreground/80 mt-2 text-sm">
                        {s.subtitle}
                      </p>
                    )}

                    <div className="mt-4 flex gap-2">
                      {s.primaryHref && (
                        <Button asChild>
                          <Link href={s.primaryHref}>{s.primaryLabel}</Link>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="border-border/40 relative z-30 flex justify-center gap-2 border-t px-2 py-4">
          <button onClick={goPrev}>Önceki</button>

          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition',
                i === active ? 'bg-primary w-5' : 'bg-foreground/25'
              )}
            />
          ))}

          <button onClick={goNext}>Sonraki</button>
        </div>
      )}
    </section>
  )
}
