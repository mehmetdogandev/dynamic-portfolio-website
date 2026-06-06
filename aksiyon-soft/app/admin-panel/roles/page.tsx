import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { RolesManagementWrapper } from '@/components/tables/role-management/roles-management-wrapper'

export default function RolesPage() {
  return (
    <DashboardLayout>
      <RolesManagementWrapper />
    </DashboardLayout>
  )
}
