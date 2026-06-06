'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SolutionTechnologyDataTable } from '@/components/tables/solution/solution-technology/data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function SolutionTechnologyPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.SOLUTION_TECHNOLOGY,
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
              Bu sayfa için SOLUTION_TECHNOLOGY kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden teknoloji yönetimi için rol ataması isteyin.
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
              Çözüm Teknolojileri
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Çözüm kartlarında gösterilen teknoloji etiketlerini yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolutionTechnologyDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
