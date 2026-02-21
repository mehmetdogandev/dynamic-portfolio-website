import Link from "next/link";
import { siteConfig } from "@/config/site";

export function CtaSection() {
  return (
    <section className="border-t bg-muted/30 py-10 sm:py-12 lg:py-16">
      <div className="container mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
          Birlikte Çalışalım
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Projeleriniz veya iş birlikleri için benimle iletişime geçebilirsiniz.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/iletisim"
            className="inline-flex items-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            İletişime Geç
          </Link>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="inline-flex items-center rounded-lg border border-border bg-background px-6 py-3 font-medium transition-colors hover:bg-accent"
          >
            {siteConfig.contact.email}
          </a>
        </div>
      </div>
    </section>
  );
}
