import type { Metadata } from "next";
import { WebsiteFooter } from "@/components/website/layout/website-footer";
import { WebsiteHeader } from "@/components/website/layout/website-header";

export const metadata: Metadata = {
  title: { default: "Mehmet Doğan | Software Engineer", template: "%s | Mehmet Doğan" },
  description:
    "Mehmet Doğan – Software Engineer. Yazılım mühendisliği, full-stack geliştirme ve teknoloji odaklı projeler.",
};

export default function WebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <WebsiteHeader />
      <main className="min-h-[calc(100vh-theme(spacing.32))] flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}
