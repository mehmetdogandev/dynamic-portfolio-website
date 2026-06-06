'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ExpertiseDataTable } from '@/components/tables/hakkimda/expertise/expertise-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function HakkimdaExpertisePage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.ABOUT_EXPERTISE,
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
              Bu sayfa için ABOUT_EXPERTISE kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden uzmanlık alanı yönetimi için rol ataması isteyin.
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
              Uzmanlık alanları
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Hakkımda sayfasındaki uzmanlık kartlarını yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpertiseDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
