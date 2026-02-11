import "@/styles/admin-theme.css";

export default function AdminPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-theme min-h-screen">{children}</div>;
}
