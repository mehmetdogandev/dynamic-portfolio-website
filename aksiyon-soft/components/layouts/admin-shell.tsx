'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import logo from '@/public/logo.png'
import { cn } from '@/lib/utils'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AdminSidebarNav } from '@/components/layouts/admin-sidebar-nav'
import { AdminMenuSearchTrigger } from '@/components/layouts/admin-menu-search'
import { AdminSidebarUserFooter } from '@/components/layouts/admin-sidebar-user-footer'

const TOP_BAR =
  'sticky top-0 z-30 flex h-16 min-h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 md:px-4'

export function AdminShell({
  children,
  noPadding = false,
  fullWidth = false,
  boundsContainerRef,
}: {
  children: React.ReactNode
  noPadding?: boolean
  fullWidth?: boolean
  boundsContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <SidebarProvider
      mobileSheetScope="admin"
      className={cn(
        'h-dvh max-h-dvh min-h-0 flex-1 overflow-hidden transition-colors duration-200',
        '[&_[data-slot=sidebar-inner]]:transition-colors [&_[data-slot=sidebar-inner]]:duration-200'
      )}
    >
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-sidebar-border transition-colors duration-200"
      >
        <SidebarHeader className="flex h-16 min-h-16 w-full min-w-0 shrink-0 flex-row items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-4 py-0">
          <Link
            href={ADMIN_PANEL_PATH}
            className="flex min-h-10 min-w-0 max-w-full items-center gap-2 rounded-md outline-none ring-sidebar-ring transition-colors duration-200 focus-visible:ring-2"
          >
            <Image
              src={logo}
              alt=""
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-md"
            />
            <span className="truncate font-semibold tracking-tight text-sidebar-foreground">
              Aksiyon Soft
            </span>
          </Link>
          <div className="shrink-0 group-data-[collapsible=icon]:hidden">
            <AdminMenuSearchTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent className="transition-colors duration-200">
          <AdminSidebarNav />
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="border-t border-sidebar-border p-2 transition-colors duration-200">
          <AdminSidebarUserFooter />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30 transition-colors duration-200">
        <header className={TOP_BAR}>
          <SidebarTrigger className="size-10 shrink-0 md:size-9" />
          <span className="text-sm font-medium text-muted-foreground">
            Yönetim paneli
          </span>
          <div className="ml-auto flex items-center gap-0.5 md:gap-1">
            <ThemeToggle />
          </div>
        </header>

        <div
          ref={boundsContainerRef}
          className={cn(
            'relative flex min-h-0 flex-1 flex-col overflow-hidden'
          )}
        >
          <main
            className={cn(
              'custom-scrollbar relative z-0 min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]',
              noPadding ? 'flex flex-col overflow-hidden' : 'p-6'
            )}
          >
            <div
              className={cn(
                noPadding
                  ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                  : 'flex min-h-0 w-full flex-1 flex-col',
                !noPadding && !fullWidth && 'mx-auto max-w-7xl'
              )}
            >
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
