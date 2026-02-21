import { SectionTitle } from "@/components/website/ui/section-title";

const skillCategories = [
  {
    title: "Programlama Dilleri",
    items: ["C#", "Python", "PHP", "JavaScript/TypeScript", "C++"],
  },
  {
    title: "Web & Backend",
    items: ["HTML", "CSS", "Vue.js", "Django", "Node.js", "Next.js"],
  },
  {
    title: "Veritabanları",
    items: ["MySQL", "PostgreSQL", "SQL Server"],
  },
  {
    title: "Mobil",
    items: ["Flutter", "React Native"],
  },
  {
    title: "Araçlar & Yönetim",
    items: ["Git", "Docker", "Trello", "Microsoft Office"],
  },
  {
    title: "İlgili Alanlar",
    items: ["IoT", "ERP", "Yapay Zeka / NLP", "tRPC", "Judge0"],
  },
];

export function SkillsInterests() {
  return (
    <section className="mt-12">
      <SectionTitle
        title="Bilgili ve İlgili Olduğum Alanlar"
        subtitle="Teknoloji ve yazılım alanında yetkinliklerim"
        className="mb-8"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skillCategories.map((category) => (
          <div
            key={category.title}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <h3 className="font-heading font-semibold text-foreground mb-3">{category.title}</h3>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-primary/10 px-3 py-1 text-primary text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
