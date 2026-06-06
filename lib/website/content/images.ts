/**
 * Remote assets via `images.unsplash.com` (see [next.config.ts](../../next.config.ts) `images.remotePatterns`).
 * Each path uses a distinct Unsplash `photo-…` id; swap for CMS or `public/` assets in production.
 */
const u = (photoPath: string) =>
  `https://images.unsplash.com/${photoPath}?auto=format&fit=crop&w=1600&q=80`

export const WEBSITE_IMAGES = {
  homeHero: u('photo-1498050108023-c5249f4df085'),
  projectCovers: [
    u('photo-1461749280684-dccba630e2f6'),
    u('photo-1677442136019-21780ecad995'),
    u('photo-1555066931-4365d14bab8c'),
    u('photo-1551434678-e076c223a692'),
  ] as const,
  blogCovers: [
    u('photo-1460925895917-afdab827c52f'),
    u('photo-1600880292203-757bb62b4baf'),
    u('photo-1523240795612-9a054b0db644'),
    u('photo-1553877522-43269d4ea984'),
  ] as const,
  gallery: [
    u('photo-1507679799987-c73779587ccf'),
    u('photo-1531482615713-2afd69097998'),
    u('photo-1531297484001-80022131f5a1'),
    u('photo-1517245386807-bb43f82c33c4'),
    u('photo-1517248135467-4c7edcad34c4'),
    u('photo-1526374965328-7f61d4dc18c5'),
  ] as const,
  contactSide: u('photo-1517694712202-14dd9538aa97'),
} as const
