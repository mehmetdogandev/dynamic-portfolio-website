'use client'

import { useTRPC } from '@/lib/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

const STORAGE_KEY = 'aksiyon_website_visit_v1'

export function WebsiteVisitTracker() {
  const trpc = useTRPC()
  const { mutateAsync } = useMutation(
    trpc.website.recordVisit.mutationOptions()
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(STORAGE_KEY)) return
    sessionStorage.setItem(STORAGE_KEY, '1')
    void mutateAsync()
  }, [mutateAsync])

  return null
}
