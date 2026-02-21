import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Lora, Prata } from "next/font/google";

import { TRPCReactProvider } from "@/lib/trpc/react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Software Engineer`,
  description: siteConfig.description,
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-prata",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${geist.variable} ${prata.variable} ${lora.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
