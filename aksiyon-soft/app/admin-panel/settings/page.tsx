import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SettingsPageContent } from '@/components/settings/settings-page-content'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsPageContent />
    </DashboardLayout>
  )
}
