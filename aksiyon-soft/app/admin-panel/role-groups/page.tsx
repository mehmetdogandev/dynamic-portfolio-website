import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { RoleGroupDataTable } from '@/components/tables/role-group-management/role-group-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function RoleGroupsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-lg sm:text-2xl font-bold">
              Rol Grupları / Ünvanlar
            </CardTitle>
            <CardDescription className="text-xs sm:text-base">
              Rol gruplarını (ünvanlar) yönetin. Her rol grubu birden fazla rolü
              içerebilir ve kullanıcılara toplu olarak atanabilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RoleGroupDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
