/**
 * Authentication configuration exports.
 */

export {
  createAuthInstance,
  getDefaultAuthInstance,
  clearAuthInstanceCache,
  auth, // Default auth instance (current year)
  type AuthSession,
  type AuthUser,
} from './database'

// Re-export adapter functionality
export { createAuthAdapter } from './adapter'
