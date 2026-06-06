import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { FavoritesSection } from '@/components/dashboard/favorites-section'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 md:p-6">
        <FavoritesSection />
      </div>
    </DashboardLayout>
  )
}
