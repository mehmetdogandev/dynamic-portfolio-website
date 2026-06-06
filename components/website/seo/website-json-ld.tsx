/** Sunucu bileşeni: JSON-LD script (Organization + WebSite). */
export function WebsiteJsonLdScript({ json }: { json: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}
