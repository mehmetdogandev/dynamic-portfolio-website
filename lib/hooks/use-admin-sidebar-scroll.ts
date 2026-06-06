'use client'

import { useEffect } from 'react'

/**
 * Keeps the active sidebar menu item visible inside the scrollable nav area.
 */
export function useAdminSidebarScrollToActive(pathname: string) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const container = document.querySelector('[data-sidebar="content"]')
      const active = container?.querySelector(
        '[data-sidebar="menu-button"][data-active="true"], [data-sidebar="menu-sub-button"][data-active="true"]'
      )
      if (active instanceof HTMLElement) {
        active.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }, 120)
    return () => window.clearTimeout(timer)
  }, [pathname])
}
