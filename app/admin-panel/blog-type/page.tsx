'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { BlogTypeDataTable } from '@/components/tables/blog-type/blog-type-data-table'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function BlogTypePage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.BLOG_TYPE,
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
              Bu sayfa için BLOG_TYPE kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden blog türü yönetimi için uygun rol ataması isteyin.
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
              Blog Türleri
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Blog kategorilerini ve hiyerarşik yapılarını yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogTypeDataTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
