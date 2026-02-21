import { SectionTitle } from "@/components/website/ui/section-title";

const proficiencyAreas = [
  {
    title: "IoT ve Donanım Yazılımı",
    description:
      "ESP32, RFID ve sensör tabanlı sistemler. Personel giriş-çıkış, otomasyon ve gerçek zamanlı veri toplama projelerinde deneyim.",
    keywords: ["ESP32", "RFID", "Gerçek zamanlı veri", "Otomasyon"],
  },
  {
    title: "ERP ve İş Süreçleri",
    description:
      "Kurumsal Kaynak Planlaması, Dolibarr, insan kaynakları, envanter ve operasyonel süreçlerin dijitalleştirilmesi.",
    keywords: ["ERP", "Dolibarr", "İş süreçleri", "CRM"],
  },
  {
    title: "Full-Stack Web Geliştirme",
    description:
      "Next.js, Django, Vue.js ile uçtan uca uygulamalar. API tasarımı, veritabanı modellemesi ve dağıtım.",
    keywords: ["Next.js", "Django", "Vue.js", "tRPC", "REST API"],
  },
  {
    title: "Yapay Zeka ve NLP",
    description:
      "Doğal dil işleme, sohbet botları (GetCody), model eğitimi. T3 AI'LE topluluğunda araştırma ve DENEYAP'ta eğitim deneyimi.",
    keywords: ["Python", "NLP", "Model eğitimi", "Sohbet botları"],
  },
];

const technologies = [
  {
    category: "Backend & API",
    items: ["Node.js", "Django", "tRPC", "REST API", "PHP", "C#"],
  },
  {
    category: "Frontend",
    items: ["Next.js", "Vue.js", "React", "TypeScript", "HTML/CSS"],
  },
  {
    category: "Veritabanı & Altyapı",
    items: ["PostgreSQL", "MySQL", "SQL Server", "Docker"],
  },
  {
    category: "Diğer",
    items: ["Git", "Judge0", "Flutter", "WordPress"],
  },
];

const interests = [
  "Açık kaynak projeler",
  "Topluluk ve mentorluk",
  "Yazılım eğitimi",
  "Elektrikli araç ve mobilite teknolojileri",
  "İş süreçlerinin dijitalleştirilmesi",
];

export function SkillsInterests() {
  return (
    <section className="mt-16">
      <SectionTitle
        title="Yetkinlikler ve İlgi Alanları"
        subtitle="Nelerde deneyimliyim, nelere ilgi duyuyorum"
        className="mb-10"
      />

      {/* Ana yetkinlik alanları */}
      <div className="mb-12">
        <h3 className="font-heading mb-6 text-lg font-semibold text-foreground">
          Uzmanlık Alanlarım
        </h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {proficiencyAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h4 className="font-heading mb-2 font-semibold text-foreground">
                {area.title}
              </h4>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                {area.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {area.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-md bg-primary/10 px-2.5 py-1 text-primary text-xs font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teknolojiler */}
      <div className="mb-12">
        <h3 className="font-heading mb-6 text-lg font-semibold text-foreground">
          Kullandığım Teknolojiler
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {technologies.map((tech) => (
            <div
              key={tech.category}
              className="rounded-lg border bg-muted/30 p-4"
            >
              <h4 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
                {tech.category}
              </h4>
              <div className="flex flex-wrap gap-2">
                {tech.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-foreground text-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* İlgi alanları */}
      <div>
        <h3 className="font-heading mb-4 text-lg font-semibold text-foreground">
          İlgi Duyduğum Konular
        </h3>
        <p className="text-muted-foreground mb-4 max-w-2xl text-sm leading-relaxed">
          Teknoloji alanında sürekli öğrenmeye açığım. Aşağıdaki konular özellikle
          ilgimi çekiyor ve projelerde yer almayı hedefliyorum:
        </p>
        <div className="flex flex-wrap gap-3">
          {interests.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-2 text-sm text-foreground"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
