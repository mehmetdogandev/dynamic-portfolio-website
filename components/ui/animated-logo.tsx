'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  widthPx?: number
  heightPx?: number
}

export function AnimatedLogo({
  size = 'md',
  className = '',
  showCompanyName = true,
  widthPx,
  heightPx,
}: AnimatedLogoProps & { showCompanyName?: boolean }) {
  const sizeClasses = {
    sm: 'w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[140px] md:h-[140px] lg:w-[130px] lg:h-[130px] xl:w-[200px] xl:h-[200px]',

    md: 'w-[150px] h-[150px] sm:w-[180px] sm:h-[180px] md:w-[180px] md:h-[180px] lg:w-[170px] lg:h-[170px] xl:w-[280px] xl:h-[280px]',

    lg: 'w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[220px] md:h-[220px] lg:w-[210px] lg:h-[210px] xl:w-[320px] xl:h-[320px]',

    xl: 'w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] md:w-[280px] md:h-[280px] lg:w-[260px] lg:h-[260px] xl:w-[400px] xl:h-[400px]',
  } as const

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 1,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.2,
      }}
      whileHover={{
        scale: 1.02,
        y: -1,
        transition: { duration: 0.3 },
      }}
    >
      <motion.div
        className={`relative ${widthPx || heightPx ? '' : sizeClasses[size]}`}
        style={
          widthPx || heightPx
            ? {
                width: widthPx ?? heightPx,
                height: heightPx ?? widthPx,
              }
            : undefined
        }
        animate={{
          rotateY: [0, 3, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Image
          src="/logo.png"
          alt="Aksiyon Soft Logo"
          fill
          className="object-contain rounded-lg"
          priority
        />

        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background:
              'radial-gradient(circle, rgba(0, 0, 0, 0.1) 0%, transparent 70%)',
            filter: 'blur(2px)',
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {showCompanyName ? (
        <motion.div
          className="flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.h1
            className="text-lg font-bold text-slate-800 leading-tight"
            whileHover={{ scale: 1.02 }}
          >
            Aksiyon Soft
          </motion.h1>
          <motion.p
            className="text-xs text-slate-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Aksiyon Soft
          </motion.p>
        </motion.div>
      ) : null}
    </motion.div>
  )
}

export function SpinningCubeLogo({ className = '' }: AnimatedLogoProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl overflow-visible w-24 h-24"
        style={{
          transformStyle:
            'preserve-3d' as React.CSSProperties['transformStyle'],
        }}
        animate={{ rotateY: [0, 360] }}
        transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
      >
        <Image
          src="/logo.png"
          alt="Aksiyon Soft Logo"
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </motion.div>
  )
}

export default AnimatedLogo
