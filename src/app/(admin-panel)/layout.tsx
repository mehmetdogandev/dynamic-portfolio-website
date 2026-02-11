import "@/styles/admin-theme.css";
import { AdminHeader } from "@/components/layout/admin/header";
import { AdminSidebar } from "@/components/layout/admin/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
