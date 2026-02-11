import "@/styles/admin-theme.css";
import { AdminLayoutShell } from "@/components/layout/admin/admin-layout-shell";

export default function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
