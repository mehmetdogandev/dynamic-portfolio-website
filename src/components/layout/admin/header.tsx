"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronRight } from "lucide-react";
import { authClient } from "@/lib/better-auth/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PAGE_TO_TITLE, PAGE_TO_HREF } from "@/lib/rbac/navigation";

export function AdminHeader() {
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = currentTime.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Get current page title from pathname
  const getCurrentPageTitle = () => {
    const currentPath = pathname || "/admin-panel";
    const pageEntry = Object.entries(PAGE_TO_HREF).find(([, href]) => href === currentPath);
    if (pageEntry) {
      const [pageKey] = pageEntry;
      return PAGE_TO_TITLE[pageKey as keyof typeof PAGE_TO_TITLE];
    }
    return null;
  };

  const currentPageTitle = getCurrentPageTitle();
  const isHomePage = pathname === "/admin-panel";

  async function handleSignOut() {
    await authClient.signOut();
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger />
      <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
        <Link
          href="/admin-panel"
          className="font-semibold text-foreground transition-colors hover:text-foreground/80"
        >
          Ana Sayfa
        </Link>
        {!isHomePage && currentPageTitle && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{currentPageTitle}</span>
          </>
        )}
      </nav>
      <div className="hidden flex-1 justify-center md:flex">
        <div className="flex items-center justify-center gap-3 text-center">
          <time className="text-sm tabular-nums text-muted-foreground">{formattedDate}</time>
          <span className="text-muted-foreground/50">·</span>
          <time className="text-sm font-semibold tabular-nums">{formattedTime}</time>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? ""} />
                <AvatarFallback>
                  {session?.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{session?.user?.name ?? "Kullanıcı"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin-panel">Profil / Ana sayfa</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Çıkış yap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
