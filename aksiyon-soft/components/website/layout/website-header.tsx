'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { getWebsiteSocialLinks } from '@/lib/website/social'
import type { PublicNavLink } from '@/lib/data/website-nav'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WebsiteMobileNavLinks } from '@/components/website/layout/website-mobile-nav-links'
import { WebsiteMobileSocialLinks } from '@/components/website/layout/website-mobile-social-links'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

function SocialRow({ className }: { className?: string }) {
  const links = getWebsiteSocialLinks()
  if (links.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {links.map(({ href, name, icon: Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={name}
        >
          <Icon className="size-5" />
        </a>
      ))}
    </div>
  )
}

export function WebsiteHeader({
  navItems,
  socialLinks,
}: {
  navItems: PublicNavLink[]
  socialLinks: PublicFooterSocialLink[]
}) {
  const pathname = usePathname()
  const envSocial = getWebsiteSocialLinks()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="w-full">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={WEBSITE_BASE || '/'}
          className="flex shrink-0 items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt="Aksiyon Soft"
            width={152}
            height={44}
            className="h-9 w-auto object-contain dark:brightness-110"
            priority
          />
        </Link>

        <nav
          className="text-foreground/90 hidden items-center gap-1 lg:flex"
          aria-label="Ana menü"
        >
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(`${item.href}/`)
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                target={item.openInNewTab ? '_blank' : undefined}
                rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                className={cn(
                  'hover:text-primary rounded-md px-3 py-2 text-sm font-medium tracking-tight transition-colors',
                  active && 'text-primary'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle
            variant="outline"
            className="border-border/60 bg-background/50 size-9 shrink-0"
            aria-label="Tema: aydınlık veya karanlık"
          />
          <SocialRow />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {envSocial.length > 0 && <SocialRow />}
          <ThemeToggle
            variant="outline"
            className="border-border/60 bg-background/50 size-9 shrink-0"
            aria-label="Tema: aydınlık veya karanlık"
          />
          {mounted ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label="Menüyü aç"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex h-full w-1/2 max-w-sm flex-col"
              >
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-serif text-lg">Menü</SheetTitle>
                  </SheetHeader>
                  <WebsiteMobileNavLinks
                    pathname={pathname ?? ''}
                    navItems={navItems}
                  />
                  {socialLinks.length > 0 && (
                    <div className="border-border mt-auto flex flex-col items-center border-t pt-4 pb-2 text-center">
                      <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                        Sosyal medya
                      </p>
                      <WebsiteMobileSocialLinks socialLinks={socialLinks} />
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Menüyü aç"
            >
              <Menu className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
