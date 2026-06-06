/**
 * Column-level RBAC removed; kept as compatibility stubs if imported elsewhere.
 */
import { AuthUser } from '../auth'
import { SCOPES } from '../db/schema'

export const getUserReadableColumnsCached = async (
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES
): Promise<string[]> => {
  'use server'
  return []
}

export const getUserWritableColumnsCached = async (
  _userId: AuthUser['id'],
  _scope: keyof typeof SCOPES
): Promise<string[]> => {
  'use server'
  return []
}
