'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'
import {
  navigationItems,
  generalItems,
  getAllSiteManagementNavItems,
  siteManagementNavBlocks,
  siteManagementSubgroups,
  japonOtoItems,
  radioMobileItems,
  type AdminNavItem,
} from '@/lib/navigation/admin-nav'

export type AdminNavGroupId =
  | 'general'
  | 'siteManagement'
  | 'radioMobile'
  | 'japonOto'

function collectNavItems(): AdminNavItem[] {
  return [
    ...navigationItems,
    ...generalItems,
    ...getAllSiteManagementNavItems(),
    ...japonOtoItems,
    ...radioMobileItems,
  ]
}

export function useAdminNavActive() {
  const pathname = usePathname()
  const isRootNavHref = useCallback(
    (href: string) => href === ADMIN_PANEL_PATH || href === '/',
    []
  )

  const allItems = useMemo(() => collectNavItems(), [])

  const isItemActive = useCallback(
    (href: string) => {
      if (pathname === href) return true
      if (!isRootNavHref(href) && pathname.startsWith(href + '/')) {
        const matchingItems = allItems.filter(
          (item) =>
            pathname === item.href ||
            (!isRootNavHref(item.href) && pathname.startsWith(item.href + '/'))
        )
        if (matchingItems.length === 0) return false
        const bestMatch = matchingItems.reduce((a, b) =>
          a.href.length >= b.href.length ? a : b
        )
        return bestMatch.href === href
      }
      return false
    },
    [pathname, allItems, isRootNavHref]
  )

  const activeGroups = useMemo(() => {
    const general = generalItems.some((item) => isItemActive(item.href))
    const radioMobile = radioMobileItems.some((item) => isItemActive(item.href))
    const japonOto = japonOtoItems.some((item) => isItemActive(item.href))
    const siteManagement = siteManagementNavBlocks.some((block) => {
      if (block.type === 'item') return isItemActive(block.item.href)
      return block.subgroup.items.some((item) => isItemActive(item.href))
    })
    return { general, siteManagement, radioMobile, japonOto }
  }, [isItemActive])

  const activeSiteSubgroupIds = useMemo(
    () =>
      siteManagementSubgroups
        .filter((group) => group.items.some((item) => isItemActive(item.href)))
        .map((group) => group.id),
    [isItemActive]
  )

  return { isItemActive, activeGroups, activeSiteSubgroupIds, pathname }
}
