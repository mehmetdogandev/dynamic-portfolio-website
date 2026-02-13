"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLink = { label: string; href: string };

type NavLinksProps = {
  links: readonly NavLink[];
  className?: string;
  onLinkClick?: () => void;
};

export function NavLinks({ links, className, onLinkClick }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Ana menü">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              "min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium transition-colors rounded-md flex items-center justify-center",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
