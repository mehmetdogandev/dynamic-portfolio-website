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
    <footer className="border-t bg-muted/30">
      <div className="container max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {siteConfig.footer.columns.map((col, i) => {
            const Icon = iconMap[col.icon as keyof typeof iconMap] ?? Building2;
            return (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-2">
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
                    className="mt-2"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            © {currentYear} {siteConfig.footer.copyright}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
