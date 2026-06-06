'use client'

import type { QueryClient } from '@tanstack/react-query'
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query'
import type { AppRouter } from './router'

/** After server-side permission cache invalidation, force nav + fine-grained checks to refetch. */
export function invalidateAuthRbacQueries(
  queryClient: QueryClient,
  trpc: TRPCOptionsProxy<AppRouter>
): void {
  void queryClient.invalidateQueries(
    trpc.auth.getNavigationPermissions.queryFilter()
  )
  void queryClient.invalidateQueries(trpc.auth.hasPermission.queryFilter())
}
