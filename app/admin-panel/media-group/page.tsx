'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { MediaGroupDataTable } from '@/components/tables/media-group/media-group-data-table'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function MediaGroupPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.MEDIA_GROUP,
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
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Erişim reddedildi
            </CardTitle>
            <CardDescription>
              Bu sayfa için MEDIA_GROUP kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className="text-muted-
            foreground text-sm"
            >
              Yöneticinizden medya grup yönetimi için uygun rol ataması isteyin.
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
              Medya Grupları
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Site galerisinde kullanılacak grup hiyerarşisini yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MediaGroupDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
