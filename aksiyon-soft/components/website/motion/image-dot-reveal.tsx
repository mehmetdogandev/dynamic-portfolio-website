'use client'

import { motion, useReducedMotion } from 'framer-motion'
import NextImage from 'next/image'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const SETTLE_EASE = [0.16, 0.84, 0.24, 1] as const

const MAX_COLS = 44
const MIN_COLS = 18
const SETTLE_DURATION = 0.72
const RADIAL_STAGGER = 0.62
const JITTER = 0.055
const IMAGE_FADE_DELAY_AFTER_LAST_DOT = 0.12
const IMAGE_FADE_DURATION = 0.55
const DEFAULT_ASPECT_RATIO = 16 / 9

function fract(n: number): number {
  return n - Math.floor(n)
}

function buildDustOffsets(
  count: number,
  spreadPx: number,
  srcSeed: number
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const s = i * 0.618 + srcSeed * 0.001
    const u = fract(Math.sin(s * 127.1 + srcSeed) * 43758.5453)
    const v = fract(Math.cos(s * 269.5 + srcSeed * 0.37) * 23421.631)
    const w = fract(Math.sin(s * 19.12 + srcSeed * 0.91) * 12345.678)
    const angle = u * Math.PI * 2
    const radius = spreadPx * (0.2 + v * 1.05)
    const x = Math.cos(angle) * radius + (w - 0.5) * spreadPx * 0.35
    const y =
      Math.sin(angle) * radius +
      (fract(Math.cos(s * 9.2 + srcSeed * 0.13) * 9999) - 0.5) * spreadPx * 0.35
    out.push({ x, y })
  }
  return out
}

function stringSeed(s: string): number {
  let h = 0
  for (let k = 0; k < s.length; k++) {
    h = (Math.imul(31, h) + s.charCodeAt(k)) | 0
  }
  return h
}

function buildRadialDelays(cols: number, rows: number): number[] {
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const raw: number[] = []
  let maxD = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot(x - cx, y - cy)
      raw.push(d)
      maxD = Math.max(maxD, d)
    }
  }
  return raw.map((d, i) => {
    const base = maxD > 0 ? (d / maxD) * RADIAL_STAGGER : 0
    const jitter = Math.sin(i * 12.9898) * JITTER
    return Math.max(0, base + jitter)
  })
}

function sampleImageToRgbStrings(
  img: HTMLImageElement,
  cols: number,
  rows: number
): string[] {
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, cols, rows)
  const { data } = ctx.getImageData(0, 0, cols, rows)
  const out: string[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      out.push(`rgb(${data[i]!},${data[i + 1]!},${data[i + 2]!})`)
    }
  }
  return out
}

function colsForWidth(widthPx: number): number {
  if (widthPx <= 0) return 32
  return Math.min(MAX_COLS, Math.max(MIN_COLS, Math.floor(widthPx / 14)))
}

function rowsForCols(cols: number, aspectRatio: number): number {
  return Math.max(1, Math.round(cols / aspectRatio))
}

export type ImageDotRevealProps = {
  src: string
  alt: string
  sizes: string
  unoptimized: boolean
  imageClassName: string
  /** width / height, e.g. 16/9 or 4/3 */
  aspectRatio?: number
  /** Wait after scroll-in before dot assembly (keeps RevealOnScroll intact) */
  entranceDelayMs?: number
  /** Sharp image slides into place when dots finish */
  entranceSlide?: { x?: number; y?: number }
}

export function ImageDotReveal({
  src,
  alt,
  sizes,
  unoptimized,
  imageClassName,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  entranceDelayMs = 0,
  entranceSlide,
}: ImageDotRevealProps) {
  const prefersReducedMotion = useReducedMotion() === true
  const rootRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  const [widthPx, setWidthPx] = useState(0)
  const [sampling, setSampling] = useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle')
  const [colors, setColors] = useState<string[] | null>(null)
  const [grid, setGrid] = useState<{ cols: number; rows: number } | null>(null)
  const [playDots, setPlayDots] = useState(false)
  const [sharpVisible, setSharpVisible] = useState(false)

  const slideX = entranceSlide?.x ?? 0
  const slideY = entranceSlide?.y ?? 0

  useEffect(() => {
    setSampling('idle')
    setColors(null)
    setGrid(null)
    setPlayDots(false)
    setSharpVisible(false)
  }, [src])

  const delays = useMemo(() => {
    if (!grid) return null
    return buildRadialDelays(grid.cols, grid.rows)
  }, [grid])

  const dustOffsets = useMemo(() => {
    if (!grid || !widthPx) return null
    const count = grid.cols * grid.rows
    const spread = Math.min(200, Math.max(72, widthPx * 0.42))
    return buildDustOffsets(count, spread, stringSeed(src))
  }, [grid, src, widthPx])

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
      { threshold: 0.06, rootMargin: '12% 0px 18% 0px' }
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setWidthPx(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const runSampling = useCallback(async () => {
    if (!inView || prefersReducedMotion || widthPx <= 0) return
    const cols = colsForWidth(widthPx)
    const rows = rowsForCols(cols, aspectRatio)
    setSampling('loading')
    setPlayDots(false)
    setSharpVisible(false)
    setColors(null)
    setGrid(null)

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.src = src

    try {
      await new Promise<void>((resolve, reject) => {
        const ok = () => resolve()
        const fail = () => reject(new Error('image-load'))
        if (img.complete && img.naturalWidth > 0) {
          ok()
          return
        }
        img.onload = ok
        img.onerror = fail
      })
    } catch {
      setSampling('error')
      return
    }

    try {
      const rgb = sampleImageToRgbStrings(img, cols, rows)
      if (rgb.length !== cols * rows) {
        setSampling('error')
        return
      }
      setGrid({ cols, rows })
      setColors(rgb)
      setSampling('done')
    } catch {
      setSampling('error')
    }
  }, [aspectRatio, inView, prefersReducedMotion, src, widthPx])

  useEffect(() => {
    if (!inView || prefersReducedMotion) return
    const t = window.setTimeout(() => {
      void runSampling()
    }, 32 + entranceDelayMs)
    return () => window.clearTimeout(t)
  }, [entranceDelayMs, inView, prefersReducedMotion, runSampling])

  useLayoutEffect(() => {
    if (
      sampling !== 'done' ||
      !colors?.length ||
      !delays?.length ||
      !dustOffsets?.length
    )
      return
    setPlayDots(false)
    const id = requestAnimationFrame(() => {
      setPlayDots(true)
    })
    return () => cancelAnimationFrame(id)
  }, [sampling, colors, delays, dustOffsets])

  useEffect(() => {
    if (!playDots || !delays?.length) return
    const last = Math.max(...delays, 0)
    const t = window.setTimeout(
      () => {
        setSharpVisible(true)
      },
      (last + SETTLE_DURATION + IMAGE_FADE_DELAY_AFTER_LAST_DOT) * 1000
    )
    return () => window.clearTimeout(t)
  }, [playDots, delays])

  const useDotEffect =
    !prefersReducedMotion &&
    sampling === 'done' &&
    colors &&
    grid &&
    delays &&
    dustOffsets

  const imageOpacity =
    prefersReducedMotion || sampling === 'error' || !useDotEffect
      ? 1
      : sharpVisible
        ? 1
        : 0

  const imageSettled =
    prefersReducedMotion ||
    sampling === 'error' ||
    !useDotEffect ||
    sharpVisible

  if (prefersReducedMotion || sampling === 'error') {
    return (
      <motion.div ref={rootRef} className="relative h-full w-full">
        <NextImage
          src={src}
          alt={alt}
          fill
          className={imageClassName}
          sizes={sizes}
          unoptimized={unoptimized}
        />
      </motion.div>
    )
  }

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <motion.div
        className="absolute inset-0 z-[2]"
        initial={false}
        animate={{
          opacity: imageOpacity,
          x: imageSettled ? 0 : slideX,
          y: imageSettled ? 0 : slideY,
        }}
        transition={{
          duration: useDotEffect && sharpVisible ? IMAGE_FADE_DURATION : 0,
          ease: EASE_OUT,
        }}
      >
        <NextImage
          src={src}
          alt={alt}
          fill
          className={imageClassName}
          sizes={sizes}
          unoptimized={unoptimized}
        />
      </motion.div>

      {useDotEffect ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] grid bg-muted/30"
          aria-hidden
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`,
          }}
        >
          {colors.map((color, i) => {
            const dust = dustOffsets[i] ?? { x: 0, y: 0 }
            return (
              <motion.span
                key={`${grid.cols}x${grid.rows}-${i}`}
                className="m-auto block aspect-square w-[58%] max-w-[10px] min-w-[1px] rounded-full sm:w-[55%] sm:max-w-[12px]"
                style={{ backgroundColor: color }}
                initial={{
                  opacity: 0,
                  scale: 0.04,
                  x: dust.x,
                  y: dust.y,
                }}
                animate={
                  playDots
                    ? sharpVisible
                      ? {
                          opacity: 0,
                          scale: 0.35,
                          x: dust.x * 0.22,
                          y: dust.y * 0.22,
                        }
                      : { opacity: 1, scale: 1, x: 0, y: 0 }
                    : {
                        opacity: 0,
                        scale: 0.04,
                        x: dust.x,
                        y: dust.y,
                      }
                }
                transition={
                  sharpVisible
                    ? { duration: 0.42, ease: EASE_OUT }
                    : {
                        delay: delays[i] ?? 0,
                        duration: SETTLE_DURATION,
                        ease: SETTLE_EASE,
                      }
                }
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
