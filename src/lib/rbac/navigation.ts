import type { Page } from "@/lib/rbac/permissions";
import {
  LayoutDashboard,
  Users,
  Shield,
  Award,
  Settings,
  FileText,
  Image,
  type LucideIcon,
} from "lucide-react";

export const PAGE_TO_TITLE: Record<Page, string> = {
  HOME_PAGE: "Ana Sayfa",
  USERS: "Kullanıcılar",
  ROLES: "Roller",
  ROLE_GROUPS: "Rol Grupları",
  SETTINGS: "Ayarlar",
  USER_ROLES: "Kullanıcı Rolleri",
  USER_ROLE_GROUPS: "Kullanıcı Rol Grupları",
  POST: "Postlar",
  LOGO: "Logolar",
};

export const PAGE_TO_HREF: Record<Page, string> = {
  HOME_PAGE: "/admin-panel",
  USERS: "/admin-panel/users",
  ROLES: "/admin-panel/roles",
  ROLE_GROUPS: "/admin-panel/role-groups",
  SETTINGS: "/admin-panel/settings",
  USER_ROLES: "/admin-panel/user-roles",
  USER_ROLE_GROUPS: "/admin-panel/user-role-groups",
  POST: "/admin-panel/posts",
  LOGO: "/admin-panel/logos",
};

export const PAGE_TO_ICON: Record<Page, LucideIcon> = {
  HOME_PAGE: LayoutDashboard,
  USERS: Users,
  ROLES: Shield,
  ROLE_GROUPS: Award,
  SETTINGS: Settings,
  USER_ROLES: Shield,
  USER_ROLE_GROUPS: Award,
  POST: FileText,
  LOGO: Image,
};

export const NAV_ITEMS: { page: Page; title: string; href: string; icon: LucideIcon }[] = [
  { page: "HOME_PAGE", title: PAGE_TO_TITLE.HOME_PAGE, href: PAGE_TO_HREF.HOME_PAGE, icon: PAGE_TO_ICON.HOME_PAGE },
  { page: "USERS", title: PAGE_TO_TITLE.USERS, href: PAGE_TO_HREF.USERS, icon: PAGE_TO_ICON.USERS },
  { page: "ROLES", title: PAGE_TO_TITLE.ROLES, href: PAGE_TO_HREF.ROLES, icon: PAGE_TO_ICON.ROLES },
  { page: "ROLE_GROUPS", title: PAGE_TO_TITLE.ROLE_GROUPS, href: PAGE_TO_HREF.ROLE_GROUPS, icon: PAGE_TO_ICON.ROLE_GROUPS },
  { page: "USER_ROLES", title: PAGE_TO_TITLE.USER_ROLES, href: PAGE_TO_HREF.USER_ROLES, icon: PAGE_TO_ICON.USER_ROLES },
  { page: "USER_ROLE_GROUPS", title: PAGE_TO_TITLE.USER_ROLE_GROUPS, href: PAGE_TO_HREF.USER_ROLE_GROUPS, icon: PAGE_TO_ICON.USER_ROLE_GROUPS },
  { page: "POST", title: PAGE_TO_TITLE.POST, href: PAGE_TO_HREF.POST, icon: PAGE_TO_ICON.POST },
  { page: "LOGO", title: PAGE_TO_TITLE.LOGO, href: PAGE_TO_HREF.LOGO, icon: PAGE_TO_ICON.LOGO },
  { page: "SETTINGS", title: PAGE_TO_TITLE.SETTINGS, href: PAGE_TO_HREF.SETTINGS, icon: PAGE_TO_ICON.SETTINGS },
];
