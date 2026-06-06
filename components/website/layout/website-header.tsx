'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { WEBSITE_BASE } from '@/lib/website/site-nav'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import type { PublicNavLink } from '@/lib/data/website-nav'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { PortfolioNavLinks } from '@/components/website/ui/portfolio-nav-links'
import { WebsiteMobileSocialLinks } from '@/components/website/layout/website-mobile-social-links'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function WebsiteHeader({
  navItems,
  socialLinks,
}: {
  navItems: PublicNavLink[]
  socialLinks: PublicFooterSocialLink[]
}) {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="w-full">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href={WEBSITE_BASE || '/'}
          className="focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={`${PORTFOLIO_CONFIG.name} ana sayfa`}
        >
          <span className="font-heading text-primary text-xl font-bold tracking-tight">
            {PORTFOLIO_CONFIG.name}
          </span>
          <span className="text-muted-foreground hidden sm:inline" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground hidden text-sm font-medium sm:inline">
            {PORTFOLIO_CONFIG.tagline}
          </span>
        </Link>

        <PortfolioNavLinks navItems={navItems} className="hidden lg:flex" />

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle
            variant="outline"
            className="border-border/60 bg-background/50 size-9 shrink-0"
            aria-label="Tema: aydınlık veya karanlık"
          />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle
            variant="outline"
            className="border-border/60 bg-background/50 size-9 shrink-0"
            aria-label="Tema: aydınlık veya karanlık"
          />
          {mounted ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 min-w-10 shrink-0"
                  aria-label="Menüyü aç"
                >
                  <Menu className="size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex min-h-full w-full max-w-xs flex-col sm:max-w-sm"
              >
                <SheetHeader>
                  <SheetTitle className="sr-only">Menü</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 pt-6">
                  <PortfolioNavLinks
                    navItems={navItems}
                    className="flex flex-col items-stretch gap-0 [&_a]:rounded-none"
                    onLinkClick={() => setOpen(false)}
                  />
                </div>
                {socialLinks.length > 0 ? (
                  <div className="border-border mt-auto flex flex-col items-center border-t pt-6 pb-8">
                    <p className="text-muted-foreground mb-2 text-sm">
                      İletişim ve sosyal medya
                    </p>
                    <WebsiteMobileSocialLinks socialLinks={socialLinks} />
                  </div>
                ) : null}
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 min-w-10 shrink-0"
              aria-label="Menüyü aç"
            >
              <Menu className="size-6" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
