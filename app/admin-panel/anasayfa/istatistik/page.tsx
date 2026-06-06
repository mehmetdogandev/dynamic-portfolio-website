'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { StatSetDataTable } from '@/components/tables/anasayfa/stat-set/stat-set-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function AnasayfaIstatistikPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.HOME_STAT_SET,
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
              Bu sayfa için HOME_STAT_SET kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden istatistik seti yönetimi için rol ataması isteyin.
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
            <CardTitle className="text-primary text-xl font-bold sm:text-2xl">
              İstatistik setleri
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Ana sayfadaki 4 istatistik kutusunu set halinde yönetin. Yalnızca
              bir set yayında olabilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatSetDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
