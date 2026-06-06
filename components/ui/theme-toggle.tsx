'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-10 w-10', className)}
        {...props}
      >
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      data-theme-toggle
      className={cn(
        'h-10 w-10 relative overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 rounded-full',
        className
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      {...props}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={cn(
            'absolute inset-0 h-4 w-4 transition-all duration-500 ease-in-out',
            isDark
              ? 'opacity-0 rotate-90 scale-75'
              : 'opacity-100 rotate-0 scale-100'
          )}
        />
        <Moon
          className={cn(
            'absolute inset-0 h-4 w-4 transition-all duration-500 ease-in-out',
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-75'
          )}
        />
      </div>

      {/* Animated background circle */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-500 ease-in-out',
          isDark
            ? 'bg-linear-to-br from-slate-800 to-slate-900 scale-100 opacity-20'
            : 'bg-linear-to-br from-yellow-200 to-orange-300 scale-0 opacity-0'
        )}
      />

      {/* Ripple effect */}
      <div
        className={cn(
          'absolute inset-0 rounded-full transition-all duration-300 ease-out',
          isDark ? 'bg-blue-500/20 scale-100' : 'bg-yellow-400/20 scale-0'
        )}
      />
    </Button>
  )
}
