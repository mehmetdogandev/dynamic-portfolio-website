'use client'

import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { SCOPES, PERMISSIONS } from '@/lib/db/schema'
import { authClient } from '@/lib/auth/client'

/**
 * Updated permission hook for new RBAC system
 * No longer requires visibility parameter since it's handled by ID-based access
 */
export const usePermission = (
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.hasPermission.queryOptions({ scope, permission }),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false,
    enabled: !!session?.session,
  })
}

/**
 * Hook to get user's role groups (new system)
 */
export const useUserRoleGroups = () => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getUserRoleGroups.queryOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!session?.session,
  })
}

/**
 * Legacy hook for backward compatibility during migration
 */
export const useUserRoles = () => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getUserRoles.queryOptions(),
    enabled: !!session?.session,
  })
}

/**
 * Hook to get navigation permissions - updated for new system
 */
export const useNavigationPermissions = () => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getNavigationPermissions.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!session?.session,
  })
}

/**
 * Hook to get user's accessible entity IDs for a specific scope
 * This replaces the old visibility-based system
 */
export const useAccessibleEntities = (
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getAccessibleEntities.queryOptions({ scope, permission }),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!session?.session && !!(scope && permission),
  })
}

/**
 * Hook to check if user has global access for a specific scope and permission
 */
export const useHasGlobalAccess = (
  scope: keyof typeof SCOPES,
  permission: keyof typeof PERMISSIONS
) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.hasGlobalAccess.queryOptions({ scope, permission }),
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    enabled: !!session?.session && !!(scope && permission),
  })
}

/**
 * Hook to get user's readable columns for a specific scope
 * Used for column-level access control
 */
export const useReadableColumns = (scope: keyof typeof SCOPES) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getReadableColumns.queryOptions({ scope }),
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    enabled: !!session?.session && !!scope,
  })
}

/**
 * Hook to get user's writable columns for a specific scope
 * Used for form field validation
 */
export const useWritableColumns = (scope: keyof typeof SCOPES) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.getWritableColumns.queryOptions({ scope }),
    staleTime: 15 * 60 * 1000, // 15 minutes cache
    enabled: !!session?.session && !!scope,
  })
}

/**
 * Convenience hook to check multiple permissions at once
 */
export const useMultiplePermissions = (
  permissions: Array<{
    scope: keyof typeof SCOPES
    permission: keyof typeof PERMISSIONS
  }>
) => {
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()

  return useQuery({
    ...trpc.auth.checkMultiplePermissions.queryOptions({ permissions }),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    enabled: !!session?.session && permissions.length > 0,
  })
}

/**
 * Hook specifically for role management operations
 * Combines permission checking with role group access
 */
export const useRoleManagementAccess = () => {
  const canAccessRoles = usePermission(SCOPES.ROLE, PERMISSIONS.ACCESS)
  const canCreateRoles = usePermission(SCOPES.ROLE, PERMISSIONS.CREATE)
  const canUpdateRoles = usePermission(SCOPES.ROLE, PERMISSIONS.UPDATE)
  const canDeleteRoles = usePermission(SCOPES.ROLE, PERMISSIONS.DELETE)

  return {
    canAccessRoles: canAccessRoles.data ?? false,
    canCreateRoles: canCreateRoles.data ?? false,
    canUpdateRoles: canUpdateRoles.data ?? false,
    canDeleteRoles: canDeleteRoles.data ?? false,
    isLoading:
      canAccessRoles.isLoading ||
      canCreateRoles.isLoading ||
      canUpdateRoles.isLoading ||
      canDeleteRoles.isLoading,
  }
}
