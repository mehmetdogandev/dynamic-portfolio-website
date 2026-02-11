"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavigationPermissions } from "@/lib/hooks/use-rbac-helpers";
import { NAV_ITEMS } from "@/lib/rbac/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: permissions, isLoading } = useNavigationPermissions();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.page === "HOME_PAGE") return true;
    if (isLoading) return false;
    return permissions?.[item.page] === true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <span className="font-semibold">Menü</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/admin-panel" && pathname.startsWith(item.href + "/"));
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
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
