'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { SectionAccentLine } from '@/components/website/motion/section-accent-line'
import { StaggerReveal } from '@/components/website/motion/stagger-reveal'
import { Layers, Shield, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const items: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: 'Özel kurumsal yazılım',
    body: 'İş modelinize uygun web ve kurum içi uygulamalar; kurumsal yazılım çözümlerinde API ve entegrasyon tasarımı.',
    icon: Layers,
  },
  {
    title: 'Güvenilir operasyon',
    body: 'Gözlemlenebilirlik, yedekleme ve sürümlü dağıtım ile üretim kalitesi.',
    icon: Shield,
  },
  {
    title: 'Sürekli değer',
    body: 'Kısa teslim döngüleri, şeffaf iletişim ve uzun vadeli bakım yaklaşımı.',
    icon: TrendingUp,
  },
]

export function WebsiteHomeServices() {
  return (
    <section
      id="services"
      className="border-border/40 bg-secondary/40 scroll-mt-20 border-y py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <RevealOnScroll variant="slideLeft" className="mb-10 max-w-2xl">
          <h1 className="text-primary font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Kurumsal yazılım ve özel uygulama geliştirme
          </h1>
          <div className="mt-6 w-fit max-w-full">
            <h2 className="text-primary font-serif inline-block text-2xl font-semibold tracking-tight sm:text-3xl">
              Hizmet alanlarımız
            </h2>
            <SectionAccentLine
              className="mt-3 block"
              span="full"
              delay={0.12}
            />
          </div>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed sm:text-base">
            Orta ve büyük ölçekli işletmeler için özel kurumsal yazılım, API ve
            veri entegrasyonu, operasyon panelleri ve güvenli teslimat.
            Süreçlerinizi birlikte dijitalleştiriyoruz.
          </p>
        </RevealOnScroll>

        <StaggerReveal
          variant="fadeUp"
          stagger={0.07}
          delay={0.04}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <Card
              key={item.title}
              className="group border-border/80 bg-card/95 flex h-full flex-col shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="bg-secondary text-primary mb-3 flex size-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105">
                  <item.icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-base font-semibold sm:text-lg">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </StaggerReveal>
      </div>
    </section>
  )
}
