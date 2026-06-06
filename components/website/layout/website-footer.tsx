import Image from 'next/image'
import Link from 'next/link'
import type { PublicNavLink } from '@/lib/data/website-nav'
import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WebsiteFooterSocialGrid } from '@/components/website/layout/website-footer-social-grid'

function trim(v: string | undefined) {
  return v?.trim() || undefined
}

export function WebsiteFooter({
  navItems,
  socialLinks,
}: {
  navItems: PublicNavLink[]
  socialLinks: PublicFooterSocialLink[]
}) {
  const year = new Date().getFullYear()
  const email =
    trim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_EMAIL) ??
    'support@aksiyonsoft.com'
  const phone = trim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_PHONE)
  const address = trim(process.env.NEXT_PUBLIC_WEBSITE_ADDRESS) ?? 'Türkiye'
  const phoneClean = phone ? phone.replace(/[^\d+]/g, '') : ''

  return (
    <footer className="border-border/60 bg-muted/30 mt-auto border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3">
          <Image
            src="/logo.png"
            alt="Aksiyon Soft"
            width={160}
            height={46}
            className="h-10 w-auto object-contain dark:brightness-110"
          />
          <p className="text-muted-foreground text-sm leading-relaxed">
            Aksiyon Soft olarak kurumsal süreçlerinizi özel yazılım, entegrasyon
            ve güvenli operasyon uygulamalarıyla dijitalleştiriyoruz.
            Ölçeklenebilir mimari ve şeffaf teslimat ile yanınızdayız.
          </p>
        </div>

        <div>
          <h2 className="text-foreground mb-4 text-sm font-semibold tracking-wide">
            Kurumsal
          </h2>
          <ul className="space-y-2.5 text-sm">
            {navItems.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  target={item.openInNewTab ? '_blank' : undefined}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-foreground mb-4 text-sm font-semibold tracking-wide">
            İletişim
          </h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${email}`}
                className="hover:text-primary transition-colors"
              >
                {email}
              </a>
            </li>
            {phone && (
              <li>
                {phoneClean.length > 5 ? (
                  <a
                    href={`tel:${phoneClean}`}
                    className="hover:text-primary transition-colors"
                  >
                    {phone}
                  </a>
                ) : (
                  <span>{phone}</span>
                )}
              </li>
            )}
            <li className="pt-1 leading-relaxed">{address}</li>
          </ul>
        </div>

        <div className="flex flex-col items-center text-center lg:-translate-x-20">
          <h2 className="text-foreground mb-4 text-sm font-semibold tracking-wide">
            Sosyal medya
          </h2>
          {socialLinks.length > 0 ? (
            <WebsiteFooterSocialGrid socialLinks={socialLinks} columns={3} />
          ) : (
            <p className="text-muted-foreground max-w-xs text-sm">
              Kurumsal hesaplar yakında burada.
            </p>
          )}
        </div>
      </div>
      <div className="border-border/60 text-muted-foreground border-t py-4 text-center text-xs">
        © {year} Aksiyon Soft. Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
