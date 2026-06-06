import { router } from '..'
import { userRouter } from './user'
import { authRouter } from './auth'
import { roleRouter } from './role'
import { roleGroupRouter } from './role-group'
import { jobsRouter } from './jobs'
import { userFavoritesRouter } from './userfavorites'
import { userPreferencesRouter } from './user-preferences'
// Inventory routers
import { mailRouter } from './mail'
import { emailLogsRouter } from './email-logs'
import { websiteRouter } from './website'
import { referenceRouter } from './reference'
import { mediaRouter } from './media'
import { mediaGroupRouter } from './media-group'
import { blogRouter } from './blog'
import { blogTypeRouter } from './blog-type'
import { sliderRouter } from './slider'
import { solutionRouter } from './solution'
import { solutionGroupRouter } from './solution-group'
import { solutionTechnologyRouter } from './solution-technology'
import { siteSeoRouter } from './site-seo'
import { headerNavRouter } from './header-nav'
import { headerSettingsRouter } from './header-settings'
import { footerNavRouter } from './footer-nav'
import { footerSocialRouter } from './footer-social'
import { aboutRouter } from './about'
import { radioMobileRouter } from './radio-mobile/index'

export const appRouter = router({
  user: userRouter,
  auth: authRouter,
  role: roleRouter,
  roleGroup: roleGroupRouter,
  userFavorites: userFavoritesRouter,
  userPreferences: userPreferencesRouter,
  // Jobs management
  jobs: jobsRouter,

  // Mail router
  mail: mailRouter,
  // Email logs router
  emailLogs: emailLogsRouter,
  website: websiteRouter,
  reference: referenceRouter,
  media: mediaRouter,
  mediaGroup: mediaGroupRouter,
  blog: blogRouter,
  blogType: blogTypeRouter,
  slider: sliderRouter,
  solution: solutionRouter,
  solutionGroup: solutionGroupRouter,
  solutionTechnology: solutionTechnologyRouter,
  siteSeo: siteSeoRouter,
  headerNav: headerNavRouter,
  headerSettings: headerSettingsRouter,
  footerNav: footerNavRouter,
  footerSocial: footerSocialRouter,
  about: aboutRouter,
  radioMobile: radioMobileRouter,
})

export type AppRouter = typeof appRouter
