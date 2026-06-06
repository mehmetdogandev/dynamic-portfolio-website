import { RevealOnScroll } from '@/components/website/motion/reveal-on-scroll'
import type { RadioMobileChannelValue } from '@/lib/radio-mobile/channels'
import { getPublicPageMeta } from '@/lib/radio-mobile/public-page-meta'
import type { PublicBuildRow } from '@/lib/radio-mobile/public-builds'
import { pickFeaturedBuild } from '@/lib/radio-mobile/public-build-utils'
import { RadioMobileBuildList } from './radio-mobile-build-list'
import { RadioMobileChannelNav } from './radio-mobile-channel-nav'
import { RadioMobileFeaturedBuild } from './radio-mobile-featured-build'
import { RadioMobileInstallGuide } from './radio-mobile-install-guide'
import { RadioMobilePublicHero } from './radio-mobile-public-hero'

export function RadioMobilePublicPage({
  channel,
  builds,
}: {
  channel: RadioMobileChannelValue
  builds: PublicBuildRow[]
}) {
  const meta = getPublicPageMeta(channel)
  const isReleaseChannel = channel.endsWith('_release')
  const featured = pickFeaturedBuild(builds)
  const hasBuilds = builds.length > 0

  return (
    <article className="text-foreground/90 mx-auto w-full max-w-6xl px-4 py-10 text-base leading-relaxed sm:px-6 sm:py-14">
      <RevealOnScroll variant="fadeUp" className="mb-8 w-full sm:mb-10">
        <RadioMobilePublicHero
          meta={meta}
          isReleaseChannel={isReleaseChannel}
        />
      </RevealOnScroll>

      <RevealOnScroll variant="fadeUp" delay={0.05} className="mb-8">
        <RadioMobileChannelNav activeChannel={channel} />
      </RevealOnScroll>

      <RevealOnScroll variant="slideUp" delay={0.08} className="w-full">
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-8">
            {featured ? (
              <RadioMobileFeaturedBuild build={featured} meta={meta} />
            ) : null}
            <RadioMobileBuildList
              builds={builds}
              meta={meta}
              excludeBuildId={featured?.id}
            />
            {!hasBuilds ? <RadioMobileInstallGuide meta={meta} /> : null}
          </div>
          {hasBuilds ? (
            <div className="mt-8 lg:sticky lg:top-24 lg:mt-0">
              <RadioMobileInstallGuide meta={meta} />
            </div>
          ) : null}
        </div>
      </RevealOnScroll>
    </article>
  )
}
