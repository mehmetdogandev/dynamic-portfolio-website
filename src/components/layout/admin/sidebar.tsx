"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ChevronDown } from "lucide-react";
import { authClient } from "@/lib/better-auth/client";
import { useNavigationPermissions } from "@/lib/hooks/use-rbac-helpers";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/rbac/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: permissions, isLoading } = useNavigationPermissions();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/admin-panel/login");
  }

  // Helper function to get nav item by page
  const getNavItem = (page: string) => {
    return NAV_ITEMS.find((item) => item.page === page);
  };

  // Check if a page is visible
  const isPageVisible = (page: string) => {
    if (page === "HOME_PAGE") return true;
    if (isLoading) return false;
    return permissions?.[page as keyof typeof permissions] === true;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Link href="/admin-panel" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                </span>
                <span className="font-semibold group-data-[collapsible=icon]:hidden">Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Ana Sayfa - at the top */}
        {isPageVisible("HOME_PAGE") && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {(() => {
                  const homeItem = getNavItem("HOME_PAGE");
                  if (!homeItem) return null;
                  const Icon = homeItem.icon;
                  const active = pathname === homeItem.href;
                  return (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={homeItem.href}>
                          <Icon className="h-4 w-4" />
                          <span>{homeItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Navigation Groups (collapsible) */}
        {NAV_GROUPS.map((group) => {
          const groupItems = group.pages
            .map((page) => getNavItem(page))
            .filter((item): item is NonNullable<typeof item> => item !== undefined && isPageVisible(item.page));

          if (groupItems.length === 0) return null;

          const groupHasActivePage = groupItems.some(
            (item) =>
              pathname === item.href || (item.href !== "/admin-panel" && pathname.startsWith(item.href + "/"))
          );

          return (
            <Collapsible key={group.label} defaultOpen={groupHasActivePage}>
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                    <span>{group.label}</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {groupItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                          pathname === item.href ||
                          (item.href !== "/admin-panel" && pathname.startsWith(item.href + "/"));
                        return (
                          <SidebarMenuItem key={item.page}>
                            <SidebarMenuButton asChild isActive={active}>
                              <Link href={item.href}>
                                <Icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* Ayarlar - at the bottom */}
        {isPageVisible("SETTINGS") && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {(() => {
                  const settingsItem = getNavItem("SETTINGS");
                  if (!settingsItem) return null;
                  const Icon = settingsItem.icon;
                  const active = pathname === settingsItem.href;
                  return (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={settingsItem.href}>
                          <Icon className="h-4 w-4" />
                          <span>{settingsItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })()}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image ?? undefined}
                      alt={session?.user?.name ?? ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{session?.user?.name ?? "Kullanıcı"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-[--radix-dropdown-menu-trigger-width]">
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
