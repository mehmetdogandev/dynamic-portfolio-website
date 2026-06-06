import Link from 'next/link'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import { sitePath } from '@/lib/website/site-nav'

export function CtaSection() {
  const { email } = PORTFOLIO_CONFIG.contact

  return (
    <section className="border-t bg-muted/30 py-10 sm:py-12 lg:py-16">
      <div className="container mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-foreground text-2xl font-bold md:text-3xl">
          Birlikte Çalışalım
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl">
          Projeleriniz veya iş birlikleri için benimle iletişime geçebilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={sitePath('iletisim')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-6 py-3 font-medium transition-colors"
          >
            İletişime Geç
          </Link>
          <a
            href={`mailto:${email}`}
            className="border-border bg-background hover:bg-accent inline-flex items-center rounded-lg border px-6 py-3 font-medium transition-colors"
          >
            {email}
          </a>
        </div>
      </div>
    </section>
  )
}
