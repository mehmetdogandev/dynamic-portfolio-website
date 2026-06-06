import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aksiyon Soft Admin Panel',
  description: 'Aksiyon Soft Admin Panel',
  robots: { index: false, follow: false },
}

export default function AdminPanelRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
