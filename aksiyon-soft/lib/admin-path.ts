function normalizeAdminPanelPath(rawPath: string | undefined): string {
  const fromEnv = (rawPath ?? '').trim()
  if (!fromEnv) return '/admin-panel'
  const withLeadingSlash = fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`
  return withLeadingSlash.replace(/\/+$/, '') || '/admin-panel'
}

/** URL prefix for admin UI (Better Auth remains on /api/auth). */
export const ADMIN_PANEL_PATH = normalizeAdminPanelPath(
  process.env.NEXT_PUBLIC_ADMIN_PANEL_URL ?? process.env.ADMIN_PANEL_URL
)

export function adminHref(path: string): string {
  if (path === '/' || path === '') {
    return ADMIN_PANEL_PATH
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return `${ADMIN_PANEL_PATH}${p}`
}
