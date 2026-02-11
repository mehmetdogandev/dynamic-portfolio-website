"use client";

import { api } from "@/lib/trpc/react";

/**
 * Returns the current user's page-based ACCESS permissions for sidebar/navigation.
 * Data shape: { USERS: true, ROLES: false, ... }
 */
export function useNavigationPermissions() {
  return api.permissions.getMyPermissions.useQuery();
}
