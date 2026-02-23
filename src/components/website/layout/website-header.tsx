"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import { NavLinks } from "@/components/website/ui/nav-links";
import { SocialLinks } from "@/components/website/ui/social-links";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
export function WebsiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="Mehmet Doğan ana sayfa"
        >
          <span className="font-mono text-xl font-bold tracking-tight text-primary">
            {siteConfig.headerBranding.logotype}
          </span>
          <span className="hidden text-muted-foreground sm:inline" aria-hidden>
            ·
          </span>
          <span className="hidden text-muted-foreground text-sm font-medium sm:inline">
            {siteConfig.headerBranding.tagline}
          </span>
        </Link>

        <NavLinks
          links={siteConfig.navLinks}
          className="hidden lg:flex"
        />

        <div className="hidden lg:flex items-center gap-1">
          <SocialLinks
            linkedin={siteConfig.socialLinks.linkedin}
            github={siteConfig.socialLinks.github}
            medium={siteConfig.socialLinks.medium}
            email={siteConfig.contact.email}
            variant="header"
          />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-10 min-w-10"
              aria-label="Menüyü aç"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex min-h-full w-full max-w-xs flex-col sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="sr-only">Menü</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 pt-6">
              <NavLinks
                links={siteConfig.navLinks}
                className="flex flex-col items-stretch gap-0 [&_a]:rounded-none"
                onLinkClick={() => setOpen(false)}
              />
            </div>
            <div className="mt-auto flex flex-col items-center border-t pt-6 pb-8">
              <p className="text-muted-foreground mb-2 text-sm">İletişim ve sosyal medya</p>
              <SocialLinks
                linkedin={siteConfig.socialLinks.linkedin}
                github={siteConfig.socialLinks.github}
                medium={siteConfig.socialLinks.medium}
                email={siteConfig.contact.email}
                variant="footer"
                className="justify-center"
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
