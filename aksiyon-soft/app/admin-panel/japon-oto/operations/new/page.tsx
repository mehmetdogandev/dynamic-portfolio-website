'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export default function JaponOperationNewPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(`${ADMIN_PANEL_PATH}/japon-oto/operations`)
  }, [router])

  return (
    <DashboardLayout fullWidth>
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    </DashboardLayout>
  )
}
