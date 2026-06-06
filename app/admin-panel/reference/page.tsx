'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ReferenceDataTable } from '@/components/tables/reference/reference-data-table'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ReferencePage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.REFERENCE,
    PERMISSIONS.ACCESS
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccess) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Erişim reddedildi
              </CardTitle>
              <CardDescription>
                Bu sayfa için REFERENCE kapsamında erişim izni gerekir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Yöneticinizden site referansları için uygun rol ataması isteyin.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold text-primary">
              Referanslar
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Web sitesinde gösterilecek müşteri / iş ortağı logoları ve
              metinler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReferenceDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
