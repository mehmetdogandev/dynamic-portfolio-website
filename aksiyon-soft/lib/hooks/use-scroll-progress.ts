'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function measureProgress(): number {
  const doc = document.documentElement
  const scrollHeight = doc.scrollHeight
  const viewportHeight = window.innerHeight
  const maxScroll = scrollHeight - viewportHeight
  if (maxScroll <= 0) return 0
  return clamp(window.scrollY / maxScroll, 0, 1)
}

export function useScrollProgress(enabled: boolean) {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [hasScrollableContent, setHasScrollableContent] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setProgress(0)
      setHasScrollableContent(false)
      return
    }

    let rafId = 0
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const update = () => {
      const next = measureProgress()
      const scrollable =
        document.documentElement.scrollHeight > window.innerHeight
      setProgress(next)
      setHasScrollableContent(scrollable)
    }

    const onScrollOrResize = () => {
      if (reducedMotion) {
        update()
        return
      }
      if (rafId) return
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        update()
      })
    }

    update()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [enabled, pathname])

  return {
    progress,
    progressPercent: Math.round(progress * 100),
    hasScrollableContent,
  }
}
