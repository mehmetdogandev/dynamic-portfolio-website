'use client'

import * as React from 'react'
import { AuthPanelShell } from '@/components/auth/auth-panel-shell'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export function AdminAuthShell({
  title,
  subtitle,
  children,
  footerExtra,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footerExtra?: React.ReactNode
}) {
  return (
    <AuthPanelShell
      brandHref={ADMIN_PANEL_PATH}
      footerLabel="Yönetim paneli"
      title={title}
      subtitle={subtitle}
      footerExtra={footerExtra}
    >
      {children}
    </AuthPanelShell>
  )
}
