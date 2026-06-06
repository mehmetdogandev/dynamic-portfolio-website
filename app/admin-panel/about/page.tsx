'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { AboutDataTable } from '@/components/tables/about/about-data-table'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AboutPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.ABOUT,
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
              Bu sayfa için ABOUT kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden hakkımızda yönetimi için uygun rol ataması isteyin.
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
              Hakkımızda
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Hakkımızda sayfası kayıtlarını yönetin ve yayın akışını kontrol
              edin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AboutDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
