import { WebsiteHero } from '@/components/website/home/website-hero'
import { getPublicHomeHeroData } from '@/lib/data/website-hero-slides'
import { WEBSITE_IMAGES } from '@/lib/website/content/images'
import { PORTFOLIO_CONFIG } from '@/lib/website/portfolio-config'
import { sitePath } from '@/lib/website/site-nav'
import type { WebsiteHeroSlide } from '@/lib/website/types'

function buildFallbackSlides(): WebsiteHeroSlide[] {
  return [
    {
      id: 'fallback-hero',
      title: PORTFOLIO_CONFIG.hero.title,
      subtitle: PORTFOLIO_CONFIG.hero.subtitle,
      imageAlt: `${PORTFOLIO_CONFIG.name} — ${PORTFOLIO_CONFIG.tagline}`,
      mediaSrc: WEBSITE_IMAGES.homeHero,
      mimeType: 'image/jpeg',
      showPrimaryButton: true,
      showSecondaryButton: true,
      primaryLabel: 'Projelerim',
      primaryHref: sitePath('projeler'),
      secondaryLabel: 'İletişim',
      secondaryHref: sitePath('iletisim'),
    },
    {
      id: 'fallback-about',
      title: 'Full-stack & ERP deneyimi',
      subtitle:
        'Next.js, Django ve kurumsal sistemler üzerine çalışıyorum. Hakkımda sayfasında deneyimlerimi ve yetkinliklerimi inceleyebilirsiniz.',
      imageAlt: 'Eğitim ve topluluk etkinliği',
      mediaSrc: WEBSITE_IMAGES.blogCovers[2],
      mimeType: 'image/jpeg',
      showPrimaryButton: true,
      showSecondaryButton: true,
      primaryLabel: 'Hakkımda',
      primaryHref: sitePath('hakkimda'),
      secondaryLabel: 'Referanslar',
      secondaryHref: sitePath('referanslar'),
    },
    {
      id: 'fallback-blog',
      title: 'Blog & teknik notlar',
      subtitle:
        'Yazılım mühendisliği, yapay zeka ve kariyer üzerine paylaştığım yazılara göz atın.',
      imageAlt: 'Teknoloji ve blog',
      mediaSrc: WEBSITE_IMAGES.projectCovers[0],
      mimeType: 'image/jpeg',
      showPrimaryButton: true,
      showSecondaryButton: false,
      primaryLabel: 'Blog',
      primaryHref: sitePath('blog'),
      secondaryLabel: null,
      secondaryHref: null,
    },
  ]
}

export async function HomeHeroSlider() {
  const { slides, type, autoplayInterval } = await getPublicHomeHeroData()
  const heroSlides = slides.length > 0 ? slides : buildFallbackSlides()

  return (
    <WebsiteHero
      slides={heroSlides}
      type={type}
      autoplayInterval={autoplayInterval}
    />
  )
}
