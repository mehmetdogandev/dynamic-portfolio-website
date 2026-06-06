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
import { projectRouter } from './project'
import { projectGroupRouter } from './project-group'
import { projectTechnologyRouter } from './project-technology'
import { siteSeoRouter } from './site-seo'
import { headerNavRouter } from './header-nav'
import { headerSettingsRouter } from './header-settings'
import { footerNavRouter } from './footer-nav'
import { footerSocialRouter } from './footer-social'
import { aboutPageProfileRouter } from './about-page-profile'
import { aboutExperienceRouter } from './about-experience'
import { aboutExpertiseRouter } from './about-expertise'
import { aboutTechnologyRouter } from './about-technology'
import { aboutInterestRouter } from './about-interest'
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
  project: projectRouter,
  projectGroup: projectGroupRouter,
  projectTechnology: projectTechnologyRouter,
  siteSeo: siteSeoRouter,
  headerNav: headerNavRouter,
  headerSettings: headerSettingsRouter,
  footerNav: footerNavRouter,
  footerSocial: footerSocialRouter,
  aboutPageProfile: aboutPageProfileRouter,
  aboutExperience: aboutExperienceRouter,
  aboutExpertise: aboutExpertiseRouter,
  aboutTechnology: aboutTechnologyRouter,
  aboutInterest: aboutInterestRouter,
  radioMobile: radioMobileRouter,
})

export type AppRouter = typeof appRouter
