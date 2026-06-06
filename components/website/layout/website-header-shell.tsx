'use client'

import { useEffect, useRef, useState } from 'react'
import type { PublicHeaderSettings } from '@/lib/data/website-header-settings'
import type { PublicNavLink } from '@/lib/data/website-nav'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WebsiteHeader } from '@/components/website/layout/website-header'
import { WebsiteScrollProgress } from '@/components/website/layout/website-scroll-progress'
import { cn } from '@/lib/utils'

export function WebsiteHeaderShell({
  settings,
  navItems,
  socialLinks,
  children,
}: {
  settings: PublicHeaderSettings
  navItems: PublicNavLink[]
  socialLinks: PublicFooterSocialLink[]
  children: React.ReactNode
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [spacerHeight, setSpacerHeight] = useState(0)

  const sticky = settings.stickyHeaderEnabled
  const showProgress = sticky && settings.scrollProgressBarEnabled

  useEffect(() => {
    if (!sticky) {
      setSpacerHeight(0)
      return
    }

    const node = shellRef.current
    if (!node) return

    const update = () => {
      setSpacerHeight(node.offsetHeight)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [sticky, showProgress])

  return (
    <>
      <div
        ref={shellRef}
        className={cn(
          'border-border/60 bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full border-b shadow-sm backdrop-blur-md',
          sticky && 'fixed top-0 left-0 right-0 z-30'
        )}
      >
        <WebsiteHeader navItems={navItems} socialLinks={socialLinks} />
        {showProgress ? <WebsiteScrollProgress enabled /> : null}
      </div>
      {sticky ? (
        <div
          aria-hidden
          className="shrink-0"
          style={{ height: spacerHeight > 0 ? spacerHeight : undefined }}
        />
      ) : null}
      {children}
    </>
  )
}
