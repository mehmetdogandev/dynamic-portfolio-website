import Link from "next/link";
import { Building2, Link2, Mail, Share2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SocialLinks } from "@/components/website/ui/social-links";
const iconMap = {
  building: Building2,
  link: Link2,
  mail: Mail,
  share: Share2,
} as const;

export function WebsiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t bg-muted/30 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] dark:opacity-[0.05]"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80')",
        }}
      />
      <div className="relative z-10">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 md:gap-12">
          {siteConfig.footer.columns.map((col, i) => {
            const Icon = iconMap[col.icon as keyof typeof iconMap] ?? Building2;
            return (
              <div key={i} className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center gap-2 md:justify-start">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{col.title}</h3>
                </div>
                {"links" in col && col.links && (
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {"items" in col && col.items && (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {col.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )}
                {"social" in col && col.social && (
                  <SocialLinks
                    linkedin={siteConfig.socialLinks.linkedin}
                    github={siteConfig.socialLinks.github}
                    medium={siteConfig.socialLinks.medium}
                    email={siteConfig.contact.email}
                    variant="footer"
                    className="mt-2 justify-center md:justify-start"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-muted-foreground text-sm">
            © {currentYear} {siteConfig.footer.copyright}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
