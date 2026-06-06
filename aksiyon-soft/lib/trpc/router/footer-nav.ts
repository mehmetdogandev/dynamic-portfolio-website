import { SCOPES } from '@/lib/db/schema'
import { createSiteNavRouter } from './site-nav-shared'

export const footerNavRouter = createSiteNavRouter(SCOPES.FOOTER_NAV, 'FOOTER')
