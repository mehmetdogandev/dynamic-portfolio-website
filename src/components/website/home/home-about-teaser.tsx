import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ArrowRight } from "lucide-react";

export function HomeAboutTeaser() {
  const lead = siteConfig.about.lead;

  return (
    <section className="border-t bg-muted/10 py-10 sm:py-12 lg:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Yazılım benim için sadece bir meslek değil
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            {lead}
          </p>
          <Link
            href="/hakkimda"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Hakkımda
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
