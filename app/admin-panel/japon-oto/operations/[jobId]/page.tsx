'use client'

import { Loader2 } from 'lucide-react'
import { use } from 'react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { OperationJobDetailView } from '@/components/tables/japon-oto/operations/operation-job-detail-view'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PERMISSIONS, SCOPES } from '@/lib/db/schema'
import { usePermission } from '@/lib/hooks/use-rbac'

type Props = { params: Promise<{ jobId: string }> }

export default function JaponOperationDetailPage({ params }: Props) {
  const { jobId } = use(params)
  const { data: canRead, isLoading } = usePermission(
    SCOPES.JAPON_OTO_OPERATIONS,
    PERMISSIONS.READ
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

  if (!canRead) {
    return (
      <DashboardLayout fullWidth>
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Erişim reddedildi
            </CardTitle>
            <CardDescription>
              İşlem detayı için JAPON_OTO_OPERATIONS READ izni gerekir.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout fullWidth>
      <OperationJobDetailView jobId={jobId} />
    </DashboardLayout>
  )
}
