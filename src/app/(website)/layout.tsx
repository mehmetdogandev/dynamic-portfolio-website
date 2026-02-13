import type { Metadata } from "next";
import { WebsiteFooter } from "@/components/website/layout/website-footer";
import { WebsiteHeader } from "@/components/website/layout/website-header";

export const metadata: Metadata = {
  title: { default: "Mimlevip | Eğitim Kurumu", template: "%s | Mimlevip" },
  description:
    "Mimlevip Eğitim Kurumu – Kaliteli eğitim, özel ders ve online ders videoları ile hedeflerinize ulaşın.",
};

export default function WebsiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <WebsiteHeader />
      <main className="flex-1">{children}</main>
      <WebsiteFooter />
    </div>
  );
}
