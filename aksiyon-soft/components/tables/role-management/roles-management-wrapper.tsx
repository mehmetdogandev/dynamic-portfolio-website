'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RoleWithCountTable } from './simple-role-data-table'
import type { Role } from '@/lib/db'

export interface RoleWithCount extends Partial<Role> {
  userCount: number
}

export function RolesManagementWrapper() {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg sm:text-2xl">Sistem Rolleri</CardTitle>
          <CardDescription className="text-xs sm:text-base">
            Mevcut roller ve izinleri görüntüleyin, düzenleyin veya yeni rol
            oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleWithCountTable />
        </CardContent>
      </Card>
    </div>
  )
}
