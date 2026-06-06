'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminNavGroupId } from '@/lib/hooks/use-admin-nav-active'

const STORAGE_KEY = 'aksiyonsoft.admin-sidebar.groups'

type PersistedGroups = Partial<Record<AdminNavGroupId, boolean>>

function readPersisted(): PersistedGroups {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PersistedGroups
  } catch {
    return {}
  }
}

function writePersisted(next: PersistedGroups) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota / private mode */
  }
}

/**
 * Sidebar grup açık/kapalı tercihi localStorage'da kalır.
 * Aktif sayfa gruptaysa grup her zaman açık; değilse son kaydedilen tercih.
 */
export function useAdminSidebarGroupsPersist(
  activeGroups: Record<AdminNavGroupId, boolean>
) {
  const [persisted, setPersisted] = useState<PersistedGroups>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setPersisted(readPersisted())
    setHydrated(true)
  }, [])

  /** Aktif grupta gezinirken açık kalan bölüm, sayfa değişince de açık kalsın. */
  useEffect(() => {
    setPersisted((prev) => {
      let dirty = false
      const next = { ...prev }
      for (const id of Object.keys(activeGroups) as AdminNavGroupId[]) {
        if (activeGroups[id] && prev[id] !== true) {
          next[id] = true
          dirty = true
        }
      }
      if (dirty) writePersisted(next)
      return dirty ? next : prev
    })
  }, [activeGroups])

  const isGroupOpen = useCallback(
    (id: AdminNavGroupId) => {
      if (activeGroups[id]) return true
      if (!hydrated) return false
      return persisted[id] ?? false
    },
    [activeGroups, persisted, hydrated]
  )

  const setGroupOpen = useCallback(
    (id: AdminNavGroupId, open: boolean) => {
      if (activeGroups[id]) return
      setPersisted((prev) => {
        const next = { ...prev, [id]: open }
        writePersisted(next)
        return next
      })
    },
    [activeGroups]
  )

  return { isGroupOpen, setGroupOpen, hydrated }
}

export const SITE_SUBGROUP_STORAGE_KEY =
  'aksiyonsoft.admin-sidebar.site-subgroups'

export function readSiteSubgroupPersisted(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(SITE_SUBGROUP_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

export function writeSiteSubgroupPersisted(next: Record<string, boolean>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SITE_SUBGROUP_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
