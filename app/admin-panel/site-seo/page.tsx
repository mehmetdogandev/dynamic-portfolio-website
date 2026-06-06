import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SiteSeoSettings } from '@/components/site-seo/site-seo-settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SiteSeoPage() {
  return (
    <DashboardLayout>
      <SiteSeoSettings />
    </DashboardLayout>
  )
}
