import { SCOPES } from '@/lib/db/schema'
import { createSiteNavRouter } from './site-nav-shared'

export const headerNavRouter = createSiteNavRouter(SCOPES.HEADER_NAV, 'HEADER')
