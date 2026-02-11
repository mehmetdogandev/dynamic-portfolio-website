import type { Page } from "@/lib/rbac/permissions";
import {
  LayoutDashboard,
  Users,
  Shield,
  Award,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const PAGE_TO_TITLE: Record<Page, string> = {
  HOME_PAGE: "Ana Sayfa",
  USERS: "Kullanıcılar",
  ROLES: "Roller",
  ROLE_GROUPS: "Rol Grupları",
  SETTINGS: "Ayarlar",
};

export const PAGE_TO_HREF: Record<Page, string> = {
  HOME_PAGE: "/admin-panel",
  USERS: "/admin-panel/users",
  ROLES: "/admin-panel/roles",
  ROLE_GROUPS: "/admin-panel/role-groups",
  SETTINGS: "/admin-panel/settings",
};

export const PAGE_TO_ICON: Record<Page, LucideIcon> = {
  HOME_PAGE: LayoutDashboard,
  USERS: Users,
  ROLES: Shield,
  ROLE_GROUPS: Award,
  SETTINGS: Settings,
};

export const NAV_ITEMS: { page: Page; title: string; href: string; icon: LucideIcon }[] = [
  { page: "HOME_PAGE", title: PAGE_TO_TITLE.HOME_PAGE, href: PAGE_TO_HREF.HOME_PAGE, icon: PAGE_TO_ICON.HOME_PAGE },
  { page: "USERS", title: PAGE_TO_TITLE.USERS, href: PAGE_TO_HREF.USERS, icon: PAGE_TO_ICON.USERS },
  { page: "ROLES", title: PAGE_TO_TITLE.ROLES, href: PAGE_TO_HREF.ROLES, icon: PAGE_TO_ICON.ROLES },
  { page: "ROLE_GROUPS", title: PAGE_TO_TITLE.ROLE_GROUPS, href: PAGE_TO_HREF.ROLE_GROUPS, icon: PAGE_TO_ICON.ROLE_GROUPS },
  { page: "SETTINGS", title: PAGE_TO_TITLE.SETTINGS, href: PAGE_TO_HREF.SETTINGS, icon: PAGE_TO_ICON.SETTINGS },
];
