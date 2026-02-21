import Link from "next/link";
import { Youtube, Linkedin, Instagram, Mail, Phone, MessageCircle, Github } from "lucide-react";
import { cn } from "@/lib/utils";

type SocialLinksProps = {
  youtube?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
  medium?: string;
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
  github,
  medium,
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
      {github && (
        <Link href={github} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="GitHub">
          <Github className={iconClass} />
        </Link>
      )}
      {medium && (
        <Link href={medium} target="_blank" rel="noopener noreferrer" className={linkClass} aria-label="Medium">
          <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
          </svg>
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
