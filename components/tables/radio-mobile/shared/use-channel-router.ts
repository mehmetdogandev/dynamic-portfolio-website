'use client'

import { useTRPC } from '@/lib/trpc/client'
import type { RadioMobileRouterKey } from './types'

export function useChannelRouter(routerKey: RadioMobileRouterKey) {
  const trpc = useTRPC()
  switch (routerKey) {
    case 'androidRelease':
      return trpc.radioMobile.androidRelease
    case 'androidDebug':
      return trpc.radioMobile.androidDebug
    case 'iosRelease':
      return trpc.radioMobile.iosRelease
    case 'iosDebug':
      return trpc.radioMobile.iosDebug
  }
}
