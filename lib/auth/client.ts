'use client'
import {
  inferAdditionalFields,
  usernameClient,
} from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { auth } from '.'

/**
 * Admin panel Better Auth client (`/api/auth`, cookie `mehmetdogandev-session`).
 * Müşteri arayüzü için `lib/auth/customer-client` kullanın.
 */

/** Same host as the page so session cookies and CSRF match (env URL may point at another interface, e.g. LAN IP vs localhost). */
function getAuthClientBaseURL(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_AUTH_URL ||
    ''
  )
}

/**
 * Hook to create an auth client.
 */
export function useAuthClient() {
  return createAuthClient({
    baseURL: getAuthClientBaseURL(),
    plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
  })
}

/**
 * Default auth client for backwards compatibility.
 * Uses current year if no specific year is selected.
 */
export const authClient = createAuthClient({
  baseURL: getAuthClientBaseURL(),
  plugins: [usernameClient(), inferAdditionalFields<typeof auth>()],
})
