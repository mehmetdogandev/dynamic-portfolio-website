import { SectionTitle } from '@/components/website/ui/section-title'
import type { WebsitePublishedAboutBundle } from '@/lib/data/website-about'

type SkillsInterestsProps = {
  expertise: WebsitePublishedAboutBundle['expertise']
  technologies: WebsitePublishedAboutBundle['technologies']
  interests: WebsitePublishedAboutBundle['interests']
}

export function SkillsInterests({
  expertise,
  technologies,
  interests,
}: SkillsInterestsProps) {
  const techByCategory = technologies.reduce<
    Record<string, WebsitePublishedAboutBundle['technologies']>
  >((acc, tech) => {
    const list = acc[tech.category] ?? []
    list.push(tech)
    acc[tech.category] = list
    return acc
  }, {})

  const hasContent =
    expertise.length > 0 || technologies.length > 0 || interests.length > 0

  if (!hasContent) return null

  return (
    <section className="mt-16">
      <SectionTitle
        title="Yetkinlikler ve İlgi Alanları"
        subtitle="Nelerde deneyimliyim, nelere ilgi duyuyorum"
        className="mb-10"
      />

      {expertise.length > 0 ? (
        <div className="mb-12">
          <h3 className="font-heading text-foreground mb-6 text-lg font-semibold">
            Uzmanlık Alanlarım
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {expertise.map((area) => (
              <div
                key={area.id}
                className="bg-card rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <h4 className="font-heading text-foreground mb-2 font-semibold">
                  {area.title}
                </h4>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {area.description}
                </p>
                {area.keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {area.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-xs font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {technologies.length > 0 ? (
        <div className="mb-12">
          <h3 className="font-heading text-foreground mb-6 text-lg font-semibold">
            Kullandığım Teknolojiler
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(techByCategory).map(([category, items]) => (
              <div key={category} className="bg-muted/30 rounded-lg border p-4">
                <h4 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span
                      key={item.id}
                      className="border-border bg-background text-foreground rounded-full border px-2.5 py-1 text-sm"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {interests.length > 0 ? (
        <div>
          <h3 className="font-heading text-foreground mb-4 text-lg font-semibold">
            İlgi Duyduğum Konular
          </h3>
          <p className="text-muted-foreground mb-4 max-w-2xl text-sm leading-relaxed">
            Teknoloji alanında sürekli öğrenmeye açığım. Aşağıdaki konular
            özellikle ilgimi çekiyor ve projelerde yer almayı hedefliyorum:
          </p>
          <div className="flex flex-wrap gap-3">
            {interests.map((item) => (
              <span
                key={item.id}
                className="bg-accent/50 text-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
              >
                <span className="bg-primary size-1.5 rounded-full" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
