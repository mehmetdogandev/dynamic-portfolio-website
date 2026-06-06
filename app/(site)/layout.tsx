import type { Metadata } from 'next'
import { getPublicSiteSeo } from '@/lib/data/website-site-seo'

/** DB'den veri okunur; `next build` / Docker imajında Postgres yok — prerender ECONNREFUSED verir. */
export const dynamic = 'force-dynamic'
import { getPublicHeaderSettings } from '@/lib/data/website-header-settings'
import {
  getPublicFooterNav,
  getPublicFooterSocials,
  getPublicHeaderNav,
} from '@/lib/data/website-nav'
import { WebsiteShell } from '@/components/website/layout/website-shell'
import { WebsiteHeaderShell } from '@/components/website/layout/website-header-shell'
import { WebsiteBreadcrumb } from '@/components/website/layout/website-breadcrumb'
import { WebsiteFooter } from '@/components/website/layout/website-footer'
import { WebsiteVisitTracker } from '@/components/website/shared/website-visit-tracker'

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteSeo()
  const description =
    site?.defaultMetaDescription?.trim() ||
    'Kurumsal yazılım, entegrasyon ve dijital dönüşüm — Aksiyon Soft.'

  const meta: Metadata = {
    title: {
      default: 'Aksiyon Soft',
      template: '%s | Aksiyon Soft',
    },
    description,
  }

  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (raw) {
    try {
      meta.metadataBase = new URL(raw.replace(/\/+$/, ''))
    } catch {
      // geçersiz URL — yoksay
    }
  }

  const g = site?.googleSiteVerification?.trim()
  if (g) {
    meta.verification = { google: g }
  }

  return meta
}

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [headerNav, footerNav, footerSocials, headerSettings] =
    await Promise.all([
      getPublicHeaderNav(),
      getPublicFooterNav(),
      getPublicFooterSocials(),
      getPublicHeaderSettings(),
    ])

  return (
    <>
      <WebsiteVisitTracker />
      <WebsiteShell>
        <WebsiteHeaderShell
          settings={headerSettings}
          navItems={headerNav}
          socialLinks={footerSocials}
        >
          <WebsiteBreadcrumb />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </WebsiteHeaderShell>
        <WebsiteFooter navItems={footerNav} socialLinks={footerSocials} />
      </WebsiteShell>
    </>
  )
}
