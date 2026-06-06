'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '@/public/logo.png'
import { AuthBackgroundVideo } from '@/components/auth/auth-background-video'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

export function AuthPanelShell({
  brandHref,
  footerLabel,
  title,
  subtitle,
  children,
  footerExtra,
}: {
  brandHref: string
  footerLabel: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footerExtra?: React.ReactNode
}) {
  const year = new Date().getFullYear()

  return (
    <div
      className={cn(
        'relative flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto',
        'bg-background text-foreground transition-colors duration-200'
      )}
    >
      <AuthBackgroundVideo
        className="absolute inset-0"
        videoClassName="opacity-[0.34] dark:opacity-[0.55]"
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-background/58 via-background/48 to-background/64 transition-colors duration-200"
        aria-hidden
      />

      <div className="relative z-10 flex justify-end p-3 pb-0 md:p-4">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8">
        <Link
          href={brandHref}
          className="mb-6 flex min-h-11 items-center gap-2 rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <Image
            src={logo}
            alt=""
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-semibold text-foreground">Aksiyon Soft</span>
        </Link>
        <div className="w-full max-w-md">
          <div
            className={cn(
              'rounded-2xl border border-border bg-card/95 p-8 shadow-sm backdrop-blur-md transition-colors duration-200 sm:p-10',
              'supports-[backdrop-filter]:bg-card/80'
            )}
          >
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-card-foreground">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {children}
            {footerExtra}
          </div>
        </div>
      </div>

      <footer className="relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground transition-colors duration-200">
        © {year} Aksiyon Soft — {footerLabel}
      </footer>
    </div>
  )
}
