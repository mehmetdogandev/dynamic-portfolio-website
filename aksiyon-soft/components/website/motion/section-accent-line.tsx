'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MOTION_DURATION, MOTION_EASE } from './motion-tokens'

export type SectionAccentLineSpan = 'short' | 'full'

export function SectionAccentLine({
  className,
  delay = 0.08,
  span = 'short',
}: {
  className?: string
  delay?: number
  /** `short`: sabit kısa çizgi. `full`: üstteki başlıkla aynı genişlikte (başlığı `inline-block`, sarmalayıcıyı `w-fit max-w-full` kullanın), soldan sağa açılır. */
  span?: SectionAccentLineSpan
}) {
  const reduceMotion = useReducedMotion()

  if (span === 'full') {
    if (reduceMotion) {
      return (
        <div
          className={cn('bg-primary h-0.5 w-full rounded-full', className)}
          aria-hidden
        />
      )
    }
    return (
      <motion.div
        className={cn(
          'bg-primary h-0.5 w-full origin-left rounded-full',
          className
        )}
        initial={{ scaleX: 0, opacity: 0.55 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{
          duration: MOTION_DURATION.slow,
          ease: MOTION_EASE,
          delay,
        }}
        aria-hidden
      />
    )
  }

  if (reduceMotion) {
    return (
      <div
        className={cn('bg-primary h-0.5 w-14 rounded-full', className)}
        aria-hidden
      />
    )
  }

  return (
    <motion.div
      className={cn('bg-primary h-0.5 origin-left rounded-full', className)}
      initial={{ width: 0, opacity: 0.5 }}
      whileInView={{ width: '3.5rem', opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: MOTION_DURATION.normal,
        ease: MOTION_EASE,
        delay,
      }}
      aria-hidden
    />
  )
}
