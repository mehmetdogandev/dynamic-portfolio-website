import { notFound } from 'next/navigation'
import { FishboneTimeline } from '@/components/website/hakkimda/fishbone-timeline'
import { SkillsInterests } from '@/components/website/hakkimda/skills-interests'
import { SectionTitle } from '@/components/website/ui/section-title'
import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import { getPublishedAboutBundle } from '@/lib/data/website-about'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { marketingPageMetadata } from '@/lib/seo/marketing-metadata'

const item = WEBSITE_MAIN_NAV.find((n) => n.id === 'hakkimda')!

export async function generateMetadata() {
  const bundle = await getPublishedAboutBundle()
  return marketingPageMetadata({
    title:
      bundle?.profile.seoTitle?.trim() || bundle?.profile.lead || 'Hakkımda',
    descriptionFallback:
      bundle?.profile.seoDescription?.trim() ||
      'Yazılım mühendisliği deneyimlerim, yetkinliklerim ve ilgi alanlarım.',
    canonicalSegment: 'hakkimda',
  })
}

export default async function HakkimdaPage() {
  const bundle = await getPublishedAboutBundle()
  if (!bundle || !bundle.profile.robotsIndex) notFound()

  const { profile, experiences, expertise, technologies, interests } = bundle

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <RevealOnScroll variant="fadeUp">
        <SectionTitle
          title={item.title}
          subtitle={PORTFOLIO_CONFIG.domain}
          className="mb-8"
        />
      </RevealOnScroll>

      <RevealOnScroll variant="slideLeft" delay={0.08}>
        <div className="font-prose prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-foreground/90 text-xl leading-[1.9] font-medium italic sm:text-2xl">
            {profile.lead}
          </p>
          <p className="text-muted-foreground text-lg leading-[1.9]">
            {profile.intro}
          </p>
          {profile.introPart2 ? (
            <p className="text-muted-foreground text-lg leading-[1.9]">
              {profile.introPart2}
            </p>
          ) : null}
          {profile.introPart3 ? (
            <p className="text-muted-foreground text-lg leading-[1.9]">
              {profile.introPart3}
            </p>
          ) : null}
          {profile.introPart4 ? (
            <p className="text-muted-foreground text-lg leading-[1.9]">
              {profile.introPart4}
            </p>
          ) : null}
        </div>
      </RevealOnScroll>

      {experiences.length > 0 ? (
        <RevealOnScroll variant="slideUp" delay={0.1}>
          <section id="deneyimler" className="mt-12 scroll-mt-24">
            <h2 className="font-heading text-foreground mb-8 text-2xl font-bold">
              Deneyimlerim
            </h2>
            <FishboneTimeline experiences={experiences} />
          </section>
        </RevealOnScroll>
      ) : null}

      <RevealOnScroll variant="scaleIn" delay={0.12}>
        <SkillsInterests
          expertise={expertise}
          technologies={technologies}
          interests={interests}
        />
      </RevealOnScroll>
    </div>
  )
}
