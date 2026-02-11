"use client";

import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/layout/admin/header";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

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

export function AdminLayoutShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isPublic = isAdminPublicPath(pathname);

  if (isPublic) {
    return (
      <div className="admin-theme flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="w-full max-w-md px-4 sm:px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="admin-theme flex min-h-screen flex-col">
      <AdminHeader />
      <SidebarProvider>
        <div className="flex flex-1">
          <AdminSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
