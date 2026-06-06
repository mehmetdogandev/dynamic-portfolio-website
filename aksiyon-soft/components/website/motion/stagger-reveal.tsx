'use client'

import { Children, isValidElement, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { RevealVariant } from './reveal-on-scroll'
import { MOTION_DURATION, MOTION_EASE } from './motion-tokens'

const itemVariants: Record<RevealVariant, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
    },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
    },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 28 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
    },
  },
  slideUp: {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE },
    },
  },
}

export function StaggerReveal({
  children,
  className,
  variant = 'fadeUp',
  stagger = 0.06,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  variant?: RevealVariant
  stagger?: number
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={cn(className)}>{children}</div>
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      {Children.toArray(children).map((child, index) => (
        <motion.div
          key={
            isValidElement(child) && child.key != null
              ? String(child.key)
              : `stagger-${index}`
          }
          variants={itemVariants[variant]}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
