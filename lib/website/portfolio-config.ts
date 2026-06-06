import { sitePath } from '@/lib/website/site-nav'

const trim = (v: string | undefined) => (v?.trim() ? v.trim() : undefined)

export const PORTFOLIO_CONFIG = {
  name: trim(process.env.NEXT_PUBLIC_PORTFOLIO_NAME) ?? 'Mehmet Doğan',
  tagline:
    trim(process.env.NEXT_PUBLIC_PORTFOLIO_TAGLINE) ?? 'Software Engineer',
  domain:
    trim(process.env.NEXT_PUBLIC_PORTFOLIO_DOMAIN) ?? 'mehmetdogandev.com',
  description:
    trim(process.env.NEXT_PUBLIC_PORTFOLIO_DESCRIPTION) ??
    'Mehmet Doğan – Software Engineer. Yazılım mühendisliği, full-stack geliştirme ve teknoloji odaklı projeler.',

  contact: {
    phone:
      trim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_PHONE) ?? '0553 657 84 02',
    email:
      trim(process.env.NEXT_PUBLIC_WEBSITE_CONTACT_EMAIL) ??
      'mehmetdogan.dev@gmail.com',
    whatsapp: trim(process.env.NEXT_PUBLIC_WEBSITE_SOCIAL_WHATSAPP),
  },

  hero: {
    title:
      trim(process.env.NEXT_PUBLIC_PORTFOLIO_HERO_TITLE) ??
      'Merhaba, ben Mehmet Doğan',
    subtitle:
      trim(process.env.NEXT_PUBLIC_PORTFOLIO_HERO_SUBTITLE) ??
      'Software Engineer. Yazılım mühendisliği alanında çalışıyorum; ERP sistemleri, web uygulamaları ve yapay zeka projeleri üzerinde deneyimim var.',
    youtubeVideoId:
      trim(process.env.NEXT_PUBLIC_PORTFOLIO_HERO_YOUTUBE_ID) ?? 'dQw4w9WgXcQ',
    quote:
      trim(process.env.NEXT_PUBLIC_PORTFOLIO_HERO_QUOTE) ??
      'Teknoloji ve yenilik alanlarında genç bireylerin becerilerini geliştirmelerine yardımcı olmak benim için motive edici bir unsur.',
  },

  stats: [
    {
      value: '3+',
      label: 'Yıl Deneyim',
      href: `${sitePath('hakkimda')}#deneyimler`,
    },
    {
      value: '12+',
      label: 'Farklı Deneyim',
      href: `${sitePath('hakkimda')}#deneyimler`,
    },
    {
      value: '7',
      label: 'Şirkette Çalışma',
      href: sitePath('referanslar'),
    },
    { value: '40+', label: 'Eğitim Verilen Öğrenci', href: null },
  ] as const,

  highlights: [
    {
      title: 'Full-Stack Web',
      desc: 'Next.js, Django, Vue.js ile uçtan uca uygulamalar ve API tasarımı.',
    },
    {
      title: 'ERP & İş Süreçleri',
      desc: 'Kurumsal sistemler, Dolibarr, insan kaynakları ve operasyonel süreçler.',
    },
    {
      title: 'IoT & Donanım',
      desc: 'ESP32, RFID, sensör tabanlı sistemler ve gerçek zamanlı veri toplama.',
    },
    {
      title: 'Yapay Zeka & NLP',
      desc: 'Sohbet botları, doğal dil işleme ve model eğitimi projeleri.',
    },
  ] as const,

  footerNav: [
    { label: 'Hakkımda', href: sitePath('hakkimda') },
    { label: 'Projeler', href: sitePath('projeler') },
    { label: 'Blog', href: sitePath('blog') },
    { label: 'Galeri', href: sitePath('galeri') },
    { label: 'İletişim', href: sitePath('iletisim') },
  ] as const,
} as const
