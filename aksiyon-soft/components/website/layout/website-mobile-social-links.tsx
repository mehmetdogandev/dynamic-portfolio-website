'use client'

import type { PublicFooterSocialLink } from '@/lib/website/public-footer-social'
import { WebsiteFooterSocialGrid } from '@/components/website/layout/website-footer-social-grid'

export function WebsiteMobileSocialLinks({
  socialLinks,
}: {
  socialLinks: PublicFooterSocialLink[]
}) {
  return <WebsiteFooterSocialGrid socialLinks={socialLinks} centered />
}
