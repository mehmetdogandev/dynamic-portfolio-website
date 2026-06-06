'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import NextImage from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const EASE_LUX = [0.22, 1, 0.36, 1] as const
const SLAT_COUNT = 7

export type ImageRevealDirection = 'fromLeft' | 'fromRight' | 'fromBottom'

export type ImageCinematicRevealProps = {
  src: string
  alt: string
  sizes: string
  unoptimized: boolean
  imageClassName: string
  /** Lets outer RevealOnScroll finish first */
  entranceDelayMs?: number
  direction?: ImageRevealDirection
  onImageError?: () => void
}

const directionOffset: Record<
  ImageRevealDirection,
  { x: number; y: number; slatOrigin: 'left' | 'right' }
> = {
  fromLeft: { x: -48, y: 0, slatOrigin: 'left' },
  fromRight: { x: 48, y: 0, slatOrigin: 'right' },
  fromBottom: { x: 0, y: 36, slatOrigin: 'left' },
}

const slatVariants: Variants = {
  covered: { scaleX: 1 },
  revealed: (i: number) => ({
    scaleX: 0,
    transition: {
      duration: 0.38,
      delay: i * 0.028,
      ease: EASE_LUX,
    },
  }),
}

const imageHidden = (x: number, y: number) => ({
  opacity: 0,
  x,
  y,
  scale: 1.14,
  filter: 'blur(20px) brightness(0.5) saturate(0.7)',
})

const imageVisible = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  filter: 'blur(0px) brightness(1) saturate(1)',
}

export function ImageCinematicReveal({
  src,
  alt,
  sizes,
  unoptimized,
  imageClassName,
  entranceDelayMs = 0,
  direction = 'fromLeft',
  onImageError,
}: ImageCinematicRevealProps) {
  const reduceMotion = useReducedMotion() === true
  const rootRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [played, setPlayed] = useState(false)
  const [shine, setShine] = useState(false)

  const offset = directionOffset[direction]

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true)
          ob.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '8% 0px 12% 0px' }
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || played || reduceMotion) return
    const t = window.setTimeout(() => setPlayed(true), entranceDelayMs)
    return () => window.clearTimeout(t)
  }, [entranceDelayMs, inView, played, reduceMotion])

  useEffect(() => {
    if (!played) return
    const t = window.setTimeout(() => setShine(true), 200)
    return () => window.clearTimeout(t)
  }, [played])

  if (reduceMotion) {
    return (
      <div ref={rootRef} className="relative h-full w-full">
        <NextImage
          src={src}
          alt={alt}
          fill
          className={imageClassName}
          sizes={sizes}
          unoptimized={unoptimized}
          onError={onImageError}
        />
      </div>
    )
  }

  return (
    <motion.div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1]"
        initial={{ opacity: 0.45 }}
        animate={{ opacity: played ? 0 : 0.45 }}
        transition={{ duration: 0.55, ease: EASE_LUX }}
        style={{
          background:
            'linear-gradient(105deg, rgba(255,60,60,0.22) 0%, transparent 40%, transparent 60%, rgba(60,120,255,0.22) 100%)',
          mixBlendMode: 'screen',
        }}
        aria-hidden
      />

      <motion.div
        className="absolute inset-0 z-[2]"
        initial={imageHidden(offset.x, offset.y)}
        animate={played ? imageVisible : imageHidden(offset.x, offset.y)}
        transition={{
          duration: 0.62,
          ease: EASE_LUX,
          delay: played ? 0.04 : 0,
        }}
      >
        <NextImage
          src={src}
          alt={alt}
          fill
          className={imageClassName}
          sizes={sizes}
          unoptimized={unoptimized}
          onError={onImageError}
        />
      </motion.div>

      <div
        className="pointer-events-none absolute inset-0 z-[3] flex"
        aria-hidden
      >
        {Array.from({ length: SLAT_COUNT }).map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="covered"
            animate={played ? 'revealed' : 'covered'}
            variants={slatVariants}
            className={cn(
              'h-full flex-1',
              'bg-gradient-to-b from-background via-background to-background/95',
              'border-background/50 border-x border-white/[0.06]'
            )}
            style={{
              transformOrigin:
                offset.slatOrigin === 'right' ? 'right center' : 'left center',
            }}
          />
        ))}
      </div>

      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 z-[4] w-[42%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/45 to-transparent mix-blend-overlay"
        initial={{ x: '-140%', opacity: 0 }}
        animate={
          shine
            ? { x: '200%', opacity: [0, 0.9, 0] }
            : { x: '-140%', opacity: 0 }
        }
        transition={{ duration: 0.5, ease: EASE_LUX }}
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-background/30 via-transparent to-transparent"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: played ? 0.4 : 0.9 }}
        transition={{ duration: 0.6, ease: EASE_LUX, delay: 0.05 }}
        aria-hidden
      />
    </motion.div>
  )
}
