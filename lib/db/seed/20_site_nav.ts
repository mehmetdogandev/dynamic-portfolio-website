import { count, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { footerSocialLink, siteNavLink } from '@/lib/db/schema'
import { WEBSITE_MAIN_NAV } from '@/lib/website/site-nav'
import { getEnvFooterSocialFallback } from '@/lib/website/social-platforms'

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
    const navRows = WEBSITE_MAIN_NAV.flatMap((item, index) => [
      {
        placement: 'HEADER' as const,
        label: item.navLabel,
        href: item.href,
        sortOrder: index,
        isActive: true,
        openInNewTab: false,
      },
      {
        placement: 'FOOTER' as const,
        label: item.navLabel,
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
    if (envSocials.length > 0) {
      await db.insert(footerSocialLink).values(
        envSocials.map((item, index) => ({
          platform: item.platform,
          url: item.url,
          type: 'ICON' as const,
          sortOrder: index,
          isActive: true,
        }))
      )
      console.log(`  Seeded ${envSocials.length} footer social link(s)`)
    } else {
      console.log('Skip footer social seed: no env social URLs configured')
    }
  } else {
    console.log(
      'Skip footer social seed: footer_social_link table is not empty'
    )
  }
}
