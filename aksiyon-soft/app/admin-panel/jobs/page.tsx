'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { JobsManagement } from '@/components/jobs/jobs-management'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePermission } from '@/lib/hooks/use-rbac'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { Loader2 } from 'lucide-react'

export default function JobsPage() {
  const { data: canAccessJobs, isLoading: isLoadingJobsAccess } = usePermission(
    SCOPES.JOB,
    PERMISSIONS.ACCESS
  )

  if (isLoadingJobsAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (!canAccessJobs) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Erişim Reddedildi
              </CardTitle>
              <CardDescription>
                Bu sayfaya erişmek için JOB kapsamında erişim iznine ihtiyacınız
                vardır.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">
                Arka plan işleri yalnızca ilgili rol izinleriyle
                görüntülenebilir.
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
            <CardTitle className="text-2xl font-bold">
              Arka Plan İşleri Yönetimi
            </CardTitle>
            <CardDescription>
              Sistemdeki arka plan işlerini görüntüleyebilir, durumlarını
              kontrol edebilir ve manuel olarak tetikleyebilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobsManagement />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
