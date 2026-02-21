import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { SocialLinks } from "@/components/website/ui/social-links";

export function ContactInfo() {
  const { contact, socialLinks } = siteConfig;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Telefon</p>
              <Link
                href={`tel:${contact.phoneRaw ?? contact.phone.replace(/\s/g, "")}`}
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                {contact.phone}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">E-posta</p>
              <Link
                href={`mailto:${contact.email}`}
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                {contact.email}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">WhatsApp</p>
              <Link
                href={contact.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                WhatsApp ile yazın
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="font-medium text-foreground mb-3">Sosyal Medya</p>
          <SocialLinks
            linkedin={socialLinks.linkedin}
            github={socialLinks.github}
            medium={socialLinks.medium}
            email={contact.email}
            variant="footer"
          />
        </CardContent>
      </Card>
    </div>
  );
}
