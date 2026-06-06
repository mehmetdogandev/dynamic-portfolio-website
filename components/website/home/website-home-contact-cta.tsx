'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { sitePath } from '@/lib/website/site-nav'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { SectionAccentLine } from '@/components/website/motion/section-accent-line'

export function WebsiteHomeContactCta() {
  return (
    <section className="from-secondary/30 bg-gradient-to-b to-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <RevealOnScroll variant="scaleIn">
          <div className="border-border/60 bg-card/60 relative overflow-hidden rounded-2xl border p-8 shadow-sm sm:p-10 md:p-12">
            <div className="from-primary/5 pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-gradient-to-br to-transparent blur-3xl" />
            <div className="relative max-w-2xl">
              <div className="w-fit max-w-full">
                <h2 className="text-primary font-serif inline-block text-2xl font-semibold tracking-tight sm:text-3xl">
                  Kurumsal yazılım çözümünüzü birlikte netleştirelim
                </h2>
                <SectionAccentLine
                  className="mt-4 block"
                  span="full"
                  delay={0.12}
                />
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
                İhtiyaç analizi, kapsam ve öncelikler için iletişim formundan
                bize ulaşın; özel yazılım ve entegrasyon ihtiyaçlarınıza en kısa
                sürede dönüş yapalım.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href={sitePath('iletisim')}>İletişim formu</Link>
                </Button>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
