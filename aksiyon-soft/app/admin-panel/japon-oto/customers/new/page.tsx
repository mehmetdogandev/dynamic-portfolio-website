'use client'

import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export default function JaponCustomerNewPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(`${ADMIN_PANEL_PATH}/japon-oto/customers`)
  }, [router])

  return (
    <DashboardLayout fullWidth>
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    </DashboardLayout>
  )
}
