import Link from "next/link";
import {
  Code2,
  Cpu,
  Database,
  Bot,
  ArrowRight,
} from "lucide-react";
import { SectionTitle } from "@/components/website/ui/section-title";

const highlights = [
  {
    icon: Code2,
    title: "Full-Stack Web",
    desc: "Next.js, Django, Vue.js ile uçtan uca uygulamalar ve API tasarımı.",
  },
  {
    icon: Database,
    title: "ERP & İş Süreçleri",
    desc: "Kurumsal sistemler, Dolibarr, insan kaynakları ve operasyonel süreçler.",
  },
  {
    icon: Cpu,
    title: "IoT & Donanım",
    desc: "ESP32, RFID, sensör tabanlı sistemler ve gerçek zamanlı veri toplama.",
  },
  {
    icon: Bot,
    title: "Yapay Zeka & NLP",
    desc: "Sohbet botları, doğal dil işleme ve model eğitimi projeleri.",
  },
];

export function HomeHighlights() {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <SectionTitle
        title="Neler Yapıyorum"
        subtitle="Uzmanlık alanlarım ve odak noktalarım"
        className="mb-10"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-heading font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/hakkimda"
          className="inline-flex items-center gap-2 text-primary text-sm font-medium transition-colors hover:underline"
        >
          Hakkımda sayfasında daha fazlası
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
