'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SolutionDataTable } from '@/components/tables/solution/solution-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function SolutionAdminPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.SOLUTION,
    PERMISSIONS.ACCESS
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Erişim reddedildi
            </CardTitle>
            <CardDescription>
              Bu sayfa için SOLUTION kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden çözüm yönetimi için uygun rol ataması isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Çözümler
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Grup seçerek çözüm kartlarını yönetin; yeni kayıt için
              Ekle&apos;ye tıklayın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolutionDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
