'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MOTION_DURATION, MOTION_EASE } from './motion-tokens'

export type RevealVariant =
  | 'fadeUp'
  | 'fadeIn'
  | 'slideLeft'
  | 'slideUp'
  | 'scaleIn'

const variants: Record<
  RevealVariant,
  { hidden: Record<string, number>; visible: Record<string, number> }
> = {
  fadeUp: { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  slideLeft: { hidden: { opacity: 0, x: 36 }, visible: { opacity: 1, x: 0 } },
  slideUp: { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1 },
  },
}

export function RevealOnScroll({
  children,
  className,
  variant = 'fadeUp',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  variant?: RevealVariant
  delay?: number
}) {
  const reduce = useReducedMotion()
  const v = variants[variant]

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: MOTION_DURATION.normal,
        delay,
        ease: MOTION_EASE,
      }}
      variants={v}
    >
      {children}
    </motion.div>
  )
}
