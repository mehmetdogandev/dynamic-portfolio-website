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
import { cn } from "@/lib/utils";

export function WebsiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="Mimlevip ana sayfa"
        >
          <span className="text-xl font-bold text-primary">{siteConfig.name}</span>
        </Link>

        <NavLinks
          links={siteConfig.navLinks}
          className="hidden lg:flex"
        />

        <div className="hidden lg:flex items-center gap-1">
          <SocialLinks
            youtube={siteConfig.socialLinks.youtube}
            linkedin={siteConfig.socialLinks.linkedin}
            instagram={siteConfig.socialLinks.instagram}
            email={siteConfig.contact.email}
            phone={siteConfig.contact.phone}
            phoneRaw={siteConfig.contact.phoneRaw}
            whatsapp={siteConfig.contact.whatsapp}
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
          <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="sr-only">Menü</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 pt-6">
              <NavLinks
                links={siteConfig.navLinks}
                className="flex-col items-stretch gap-0"
                onLinkClick={() => setOpen(false)}
              />
              <div className="border-t pt-4">
                <p className="text-muted-foreground text-sm mb-2">İletişim ve sosyal medya</p>
                <SocialLinks
                  youtube={siteConfig.socialLinks.youtube}
                  linkedin={siteConfig.socialLinks.linkedin}
                  instagram={siteConfig.socialLinks.instagram}
                  email={siteConfig.contact.email}
                  phone={siteConfig.contact.phone}
                  phoneRaw={siteConfig.contact.phoneRaw}
                  whatsapp={siteConfig.contact.whatsapp}
                  variant="footer"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
