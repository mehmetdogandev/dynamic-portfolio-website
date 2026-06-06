import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { UserDataTable } from '@/components/tables/user/user-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Sistem Kullanıcıları
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Mevcut kullanıcıları görüntüleyebilir, düzenleyebilir ve rol
              atamalarını yönetebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
