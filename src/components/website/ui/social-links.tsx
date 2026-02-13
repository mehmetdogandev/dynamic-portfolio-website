import Link from "next/link";
import { Youtube, Linkedin, Instagram, Mail, Phone, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SocialLinksProps = {
  youtube?: string;
  linkedin?: string;
  instagram?: string;
  email?: string;
  phone?: string;
  phoneRaw?: string;
  whatsapp?: string;
  variant?: "header" | "footer";
  className?: string;
};

const iconClass = "size-5 shrink-0";

export function SocialLinks({
  youtube,
  linkedin,
  instagram,
  email,
  phone,
  phoneRaw,
  whatsapp,
  variant = "header",
  className,
}: SocialLinksProps) {
  const linkClass =
    variant === "header"
      ? "flex size-10 min-w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      : "flex size-9 min-w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {youtube && (
        <Link href={youtube} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="YouTube">
          <Youtube className={iconClass} />
        </Link>
      )}
      {linkedin && (
        <Link href={linkedin} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="LinkedIn">
          <Linkedin className={iconClass} />
        </Link>
      )}
      {instagram && (
        <Link href={instagram} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="Instagram">
          <Instagram className={iconClass} />
        </Link>
      )}
      {email && (
        <Link href={`mailto:${email}`} className={linkClass} aria-label="E-posta">
          <Mail className={iconClass} />
        </Link>
      )}
      {phone && (
        <Link href={`tel:${phoneRaw ?? phone.replace(/\s/g, "")}`} className={linkClass} aria-label="Telefon">
          <Phone className={iconClass} />
        </Link>
      )}
      {whatsapp && (
        <Link href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="WhatsApp">
          <MessageCircle className={iconClass} />
        </Link>
      )}
    </div>
  );
}
