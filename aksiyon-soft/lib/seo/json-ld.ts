/** JSON-LD graph parçaları — `<script type="application/ld+json">` ile kullanın. */

export type OrganizationWebSiteLd = {
  '@context': 'https://schema.org'
  '@graph': Array<Record<string, unknown>>
}

export function buildOrganizationAndWebSiteJsonLd(input: {
  siteUrl: string
  organizationName: string
  description?: string | null
  sameAs?: string[]
}): OrganizationWebSiteLd {
  const sameAs = (input.sameAs ?? []).filter(Boolean)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${input.siteUrl}#organization`,
        name: input.organizationName,
        url: input.siteUrl,
        ...(input.description ? { description: input.description } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${input.siteUrl}#website`,
        url: input.siteUrl,
        name: input.organizationName,
        publisher: { '@id': `${input.siteUrl}#organization` },
      },
    ],
  }
}

export function buildBlogPostingJsonLd(input: {
  url: string
  headline: string
  description: string
  datePublished: string
  imageUrl?: string | null
  authorName?: string | null
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
    ...(input.authorName
      ? { author: { '@type': 'Person', name: input.authorName } }
      : {}),
  }
}
