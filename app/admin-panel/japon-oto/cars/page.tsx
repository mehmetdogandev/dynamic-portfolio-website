'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { JaponCarsDataTable } from '@/components/tables/japon-oto/cars/cars-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function JaponCarsPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.JAPON_OTO_CAR,
    PERMISSIONS.ACCESS
  )

  if (isLoading) {
    return (
      <DashboardLayout fullWidth>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccess) {
    return (
      <DashboardLayout fullWidth>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Erişim reddedildi
            </CardTitle>
            <CardDescription>
              Bu sayfa için JAPON_OTO_CAR ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout fullWidth>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Araçlar
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Plaka bazında araç kayıtlarını ve güncel sahip bilgilerini
              izleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JaponCarsDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
