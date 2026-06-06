'use client'

import * as React from 'react'
import { AuthBackgroundVideo } from '@/components/auth/auth-background-video'
import { cn } from '@/lib/utils'

export function WebsiteShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-dvh flex-col overflow-x-hidden',
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <AuthBackgroundVideo className="absolute inset-0 h-full w-full" />
        <div
          className="absolute inset-0 bg-background/85 dark:bg-background/80"
          aria-hidden
        />
      </div>
      {children}
    </div>
  )
}
