'use client'

import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { SiteNavDataTable } from '@/components/tables/site-nav/site-nav-data-table'
import { FooterSocialDataTable } from '@/components/tables/footer-social/footer-social-data-table'
import { usePermission } from '@/lib/hooks/use-rbac'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function FooterNavPage() {
  const { data: canAccess, isLoading } = usePermission(
    SCOPES.FOOTER_NAV,
    PERMISSIONS.ACCESS
  )

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
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
              Bu sayfa için FOOTER_NAV kapsamında ACCESS izni gerekir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Yöneticinizden footer yönetimi için uygun rol ataması isteyin.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Footer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Alt menü linkleri ve sosyal medya hesaplarını yönetin.
          </p>
        </div>
        <SiteNavDataTable variant="footer" />
        <FooterSocialDataTable />
      </div>
    </DashboardLayout>
  )
}
