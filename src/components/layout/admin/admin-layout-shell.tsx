"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { AdminHeader } from "@/components/layout/admin/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ADMIN_PUBLIC_PATHS = [
  "/admin-panel/login",
  "/admin-panel/forgot-password",
  "/admin-panel/reset-password",
];

function isAdminPublicPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return ADMIN_PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function AdminLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isPublic = isAdminPublicPath(pathname);
  const { theme } = useTheme();

  if (isPublic) {
    return (
      <div className={cn("admin-theme", theme === "dark" && "dark", "flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20")}>
        <div className="w-full max-w-md px-4 sm:px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("admin-theme", theme === "dark" && "dark", "flex min-h-screen flex-col")}>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export function AdminLayoutShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ThemeProvider>
  );
}
