'use client'

import { AlertTriangle } from 'lucide-react'

export function ActiveConflictAlert({ displayName }: { displayName: string }) {
  return (
    <div
      className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        Aktif <strong>{displayName}</strong> bulunmaktadır. Aktif olarak
        eklemeniz durumunda diğeri <strong>{displayName}</strong> pasif duruma
        düşecektir.
      </p>
    </div>
  )
}
