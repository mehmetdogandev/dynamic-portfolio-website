import { NextRequest, NextResponse } from 'next/server'
import { getCachedSession } from './lib/utils/auth'
import { PERMISSIONS, SCOPES } from './lib/db/schema'
import { canCached as can } from './lib/utils/rbac-cached'
import { logger } from './lib/logger'
import { ADMIN_PANEL_PATH } from './lib/admin-path'

const ADMIN_BASE = ADMIN_PANEL_PATH

const pathsToScopes: Record<string, (typeof SCOPES)[keyof typeof SCOPES]> = {
  [`${ADMIN_BASE}/users`]: SCOPES.USER,
  [`${ADMIN_BASE}/roles`]: SCOPES.ROLE,
  [`${ADMIN_BASE}/role-groups`]: SCOPES.ROLE_GROUP,
  [`${ADMIN_BASE}/mail`]: SCOPES.MAIL,
  [`${ADMIN_BASE}/email-logs`]: SCOPES.MAIL_LOG,
  [`${ADMIN_BASE}/jobs`]: SCOPES.JOB,
  [`${ADMIN_BASE}/reference`]: SCOPES.REFERENCE,
  [`${ADMIN_BASE}/media`]: SCOPES.MEDIA,
  [`${ADMIN_BASE}/media-group`]: SCOPES.MEDIA_GROUP,
  [`${ADMIN_BASE}/anasayfa/istatistik`]: SCOPES.HOME_STAT_SET,
  [`${ADMIN_BASE}/anasayfa/neler-yapiyorum`]: SCOPES.HOME_HIGHLIGHT,
  [`${ADMIN_BASE}/anasayfa/slider`]: SCOPES.SLIDER,
  [`${ADMIN_BASE}/slider`]: SCOPES.SLIDER,
  [`${ADMIN_BASE}/project/technology`]: SCOPES.PROJECT_TECHNOLOGY,
  [`${ADMIN_BASE}/project/group`]: SCOPES.PROJECT_GROUP,
  [`${ADMIN_BASE}/project`]: SCOPES.PROJECT,
  [`${ADMIN_BASE}/site-seo`]: SCOPES.SITE_SEO,
  [`${ADMIN_BASE}/hakkimda/profile`]: SCOPES.ABOUT_PROFILE,
  [`${ADMIN_BASE}/hakkimda/experience`]: SCOPES.ABOUT_EXPERIENCE,
  [`${ADMIN_BASE}/hakkimda/expertise`]: SCOPES.ABOUT_EXPERTISE,
  [`${ADMIN_BASE}/hakkimda/technology`]: SCOPES.ABOUT_TECHNOLOGY,
  [`${ADMIN_BASE}/hakkimda/interest`]: SCOPES.ABOUT_INTEREST,
  [`${ADMIN_BASE}/about`]: SCOPES.ABOUT_PROFILE,
}
export async function proxy(request: NextRequest) {
  const start = Date.now()
  const { pathname } = request.nextUrl

  // Supplier RFQ token portal is intentionally public.
  if (pathname.startsWith('/purchase/rfq/supplier-portal')) {
    return NextResponse.next()
  }

  // Match longest path first so /sheet-orders/planning uses SHEET_ORDER_PLAN, not SHEET_ORDER
  const scope = Object.entries(pathsToScopes)
    .filter(([path]) => pathname.startsWith(path))
    .sort(([a], [b]) => b.length - a.length)[0]?.[1]
  if (scope) {
    const session = await getCachedSession(request.headers)
    if (!session) {
      const duration = Date.now() - start
      const logEntry = {
        type: 'UNAUTHENTICATED_ACCESS',
        duration,
        userId: null,
        to: request.nextUrl.pathname,
        from: request.headers.get('referer') || null,
        method: request.method,
        userAgent: request.headers.get('user-agent') ?? null,
      }
      logger.warn(logEntry, 'Unauthenticated access attempt')
      return NextResponse.redirect(new URL(ADMIN_BASE, request.url))
    }
    const isAuthorized = await can(session.user.id, scope, PERMISSIONS.ACCESS)
    if (!isAuthorized) {
      // cancel request and redirect to back
      const duration = Date.now() - start
      const logEntry = {
        type: 'UNAUTHORIZED_ACCESS',
        duration,
        userId: session.user.id,
        to: request.nextUrl.pathname,
        from: request.headers.get('referer') || null,
        method: request.method,
        userAgent: request.headers.get('user-agent') ?? null,
        scope,
      }
      logger.warn(logEntry, 'Unauthorized access attempt')
      return NextResponse.redirect(new URL(ADMIN_BASE, request.url))
    } else {
      const duration = Date.now() - start
      const logEntry = {
        type: 'AUTHORIZED_ACCESS',
        duration,
        userId: session.user.id,
        to: request.nextUrl.pathname,
        from: request.headers.get('referer') || null,
        method: request.method,
        userAgent: request.headers.get('user-agent') ?? null,
        scope,
      }
      logger.info(logEntry, 'Authorized access')
      return NextResponse.next()
    }
  }

  const duration = Date.now() - start
  const logEntry = {
    type: 'NON_PROTECTED_PATH',
    duration,
    to: request.nextUrl.pathname,
    from: request.headers.get('referer') || null,
    method: request.method,
  }
  logger.debug(logEntry, 'Non-protected path access')
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|rpc).*)'],
}
