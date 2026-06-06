import { redirect } from 'next/navigation'
import { adminHref } from '@/lib/admin-path'

export default function LegacySliderRedirectPage() {
  redirect(adminHref('/anasayfa/slider'))
}
