import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { footerSocialLink, siteNavLink } from '@/lib/db/schema'
import { sitePath } from '@/lib/website/site-nav'
import { getEnvFooterSocialFallback } from '@/lib/website/social-platforms'

/** referance/.../src/config/site.ts — nav + sosyal linkler */
const NAV_SEED = [
  { label: 'Anasayfa', href: sitePath('') },
  { label: 'Hakkımda', href: sitePath('hakkimda') },
  { label: 'Projeler', href: sitePath('projeler') },
  { label: 'Blog', href: sitePath('blog') },
  { label: 'Galeri', href: sitePath('galeri') },
  { label: 'Referanslar', href: sitePath('referanslar') },
  { label: 'İletişim', href: sitePath('iletisim') },
] as const

const SOCIAL_SEED = [
  {
    platform: 'LINKEDIN' as const,
    url: 'https://www.linkedin.com/in/mehmetdogandev',
    type: 'ICON' as const,
  },
  {
    platform: 'GITHUB' as const,
    url: 'https://github.com/mehmetdogandev',
    type: 'ICON' as const,
  },
  {
    platform: 'OTHER' as const,
    customLabel: 'Medium',
    url: 'https://medium.com/@mehmetdogan.dev',
    type: 'ICON' as const,
  },
] as const

async function countActiveRows(
  table: typeof siteNavLink | typeof footerSocialLink
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(table)
    .where(isNull(table.deletedAt))
  return row?.n ?? 0
}

export async function seed() {
  const navCount = await countActiveRows(siteNavLink)
  if (navCount === 0) {
    const navRows = NAV_SEED.flatMap((item, index) => [
      {
        placement: 'HEADER' as const,
        label: item.label,
        href: item.href,
        sortOrder: index,
        isActive: true,
        openInNewTab: false,
      },
      {
        placement: 'FOOTER' as const,
        label: item.label,
        href: item.href,
        sortOrder: index,
        isActive: true,
        openInNewTab: false,
      },
    ])
    await db.insert(siteNavLink).values(navRows)
    console.log(`  Seeded ${navRows.length} site nav link(s)`)
  } else {
    console.log('Skip site nav seed: site_nav_link table is not empty')
  }

  const socialCount = await countActiveRows(footerSocialLink)
  if (socialCount === 0) {
    const envSocials = getEnvFooterSocialFallback()
    const rows =
      envSocials.length > 0
        ? envSocials.map((item, index) => ({
            platform: item.platform,
            url: item.url,
            type: 'ICON' as const,
            sortOrder: index,
            isActive: true,
          }))
        : SOCIAL_SEED.map((item, index) => ({
            platform: item.platform,
            customLabel: 'customLabel' in item ? item.customLabel : undefined,
            url: item.url,
            type: item.type,
            sortOrder: index,
            isActive: true,
          }))

    await db.insert(footerSocialLink).values(rows)
    console.log(`  Seeded ${rows.length} footer social link(s)`)
  } else {
    console.log(
      'Skip footer social seed: footer_social_link table is not empty'
    )
  }
}
