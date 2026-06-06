import type { BlogContent } from '@/lib/blog/content'

export interface WebsiteAboutPreview {
  title: string
  summary: string
}

export interface WebsiteSolution {
  id: string
  slug: string
  title: string
  description: string
  content: BlogContent
  /** Cover image: local path under / or remote URL (next/image) */
  imageSrc: string
  tags: string[]
  sector: string
  /** Populated from CMS; used for home teaser preference */
  isFeatured?: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  robotsIndex?: boolean
  coverImageAlt?: string | null
}

export interface WebsiteBlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: BlogContent
  date: string
  category: string
  imageSrc?: string
  seoTitle?: string | null
  seoDescription?: string | null
  robotsIndex?: boolean
  coverImageAlt?: string | null
}

export interface WebsiteReference {
  id: string
  name: string
  sector: string
  /** Kart ön yüzü / liste */
  description?: string
  /** Monogram (ör. "AT") — logo dosyası yoksa kullanılır */
  logoText?: string
  /** `public/` altı veya next/image uyumlu URL */
  logoSrc?: string
  websiteUrl?: string
  /** Kart arkası: kısa özet */
  summary?: string
  /** Monogram arka planı için Tailwind gradient sınıfları (opsiyonel) */
  monogramClass?: string
  /** Logo görseli için erişilebilir açıklama; yoksa UI `{name} logosu` üretir */
  logoAlt?: string
}

export type WebsiteGalleryKind = 'etkinlik' | 'solution' | 'topluluk'

export interface WebsiteGalleryItem {
  id: string
  title: string
  imageSrc: string
  alt: string
  caption?: string
  detail?: string
  kind?: WebsiteGalleryKind
}

export interface WebsiteGalleryGroup {
  id: string
  title: string
  subtitle?: string
  items: WebsiteGalleryItem[]
}

/** Public home hero slide (from `slider` / `files`, RSC). */
export interface WebsiteHeroSlide {
  id: string
  title: string
  subtitle: string | null
  imageAlt: string | null
  /** `/api/files/{id}/view` */
  mediaSrc: string
  mimeType: string | null
  showPrimaryButton: boolean
  showSecondaryButton: boolean
  primaryLabel: string | null
  primaryHref: string | null
  secondaryLabel: string | null
  secondaryHref: string | null
}
