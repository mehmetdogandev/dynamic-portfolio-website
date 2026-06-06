'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { HighlightDataTable } from '@/components/tables/anasayfa/highlight/highlight-data-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

export default function AnasayfaNelerYapiyorumPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.HOME_HIGHLIGHT,
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
              Bu sayfa için HOME_HIGHLIGHT kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden Neler Yapıyorum kartları için rol ataması isteyin.
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
              Neler Yapıyorum
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Ana sayfadaki uzmanlık kartlarını sıralayın ve düzenleyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HighlightDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
