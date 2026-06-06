import Link from 'next/link'
import { Building2, Link2, Mail, Share2 } from 'lucide-react'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import type { PublicNavLink } from '@/lib/data/website-nav'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WebsiteFooterSocialGrid } from '@/components/website/layout/website-footer-social-grid'

const iconMap = {
  building: Building2,
  link: Link2,
  mail: Mail,
  share: Share2,
} as const

export function WebsiteFooter({
  navItems,
  socialLinks,
}: {
  navItems: PublicNavLink[]
  socialLinks: PublicFooterSocialLink[]
}) {
  const year = new Date().getFullYear()
  const { phone, email } = PORTFOLIO_CONFIG.contact
  const footerLinks =
    navItems.length > 0
      ? navItems.map((item) => ({ label: item.label, href: item.href }))
      : [...PORTFOLIO_CONFIG.footerNav]

  const columns = [
    {
      title: 'Sayfalar',
      icon: 'link' as const,
      links: footerLinks,
    },
    {
      title: 'İletişim',
      icon: 'mail' as const,
      items: [phone, email].filter(Boolean),
    },
    {
      title: 'Sosyal Medya',
      icon: 'share' as const,
      social: true,
    },
  ]

  return (
    <footer className="bg-muted/30 relative overflow-hidden border-t">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')",
        }}
      />
      <div className="relative z-10">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <h3 className="font-heading text-foreground text-sm font-semibold">
                  {PORTFOLIO_CONFIG.name}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {PORTFOLIO_CONFIG.description}
              </p>
            </div>

            {columns.map((col) => {
              const Icon = iconMap[col.icon]
              return (
                <div
                  key={col.title}
                  className="space-y-3 text-center md:text-left"
                >
                  <div className="flex items-center justify-center gap-2 md:justify-start">
                    <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="text-foreground text-sm font-semibold">
                      {col.title}
                    </h3>
                  </div>
                  {'links' in col && col.links ? (
                    <ul className="text-muted-foreground space-y-2 text-sm">
                      {col.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="hover:text-foreground underline-offset-4 transition-colors hover:underline"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {'items' in col && col.items ? (
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      {col.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {'social' in col && col.social ? (
                    socialLinks.length > 0 ? (
                      <WebsiteFooterSocialGrid
                        socialLinks={socialLinks}
                        columns={3}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Sosyal hesaplar yakında burada.
                      </p>
                    )
                  ) : null}
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex justify-center border-t pt-5">
            <p className="text-muted-foreground text-center text-sm">
              © {year} {PORTFOLIO_CONFIG.name}. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
