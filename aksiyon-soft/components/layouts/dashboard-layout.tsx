'use client'

import { useRef } from 'react'
import AuthenticatedLayout from '../auth/authenticated-layout'
import LoginPage from '../auth/login-page'
import { AdminShell } from '@/components/layouts/admin-shell'
import { AdminMenuSearchProvider } from '@/components/layouts/admin-menu-search'
import { BreadcrumbLabelProvider } from '@/lib/contexts/breadcrumb-label-context'

export function DashboardLayout({
  children,
  noPadding = false,
  fullWidth = false,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  fullWidth?: boolean
}) {
  const dashboardContentRef = useRef<HTMLDivElement>(null)

  return (
    <AuthenticatedLayout fallback={<LoginPage showSignUpLink={false} />}>
      <AdminMenuSearchProvider>
        <BreadcrumbLabelProvider>
          <div
            data-admin-shell
            className="flex h-dvh max-h-screen min-h-0 w-full flex-1 flex-col overflow-hidden bg-admin-shell-bg"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <AdminShell
                boundsContainerRef={dashboardContentRef}
                noPadding={noPadding}
                fullWidth={fullWidth}
              >
                {children}
              </AdminShell>
            </div>
          </div>
        </BreadcrumbLabelProvider>
      </AdminMenuSearchProvider>
    </AuthenticatedLayout>
  )
}
