import { redirect } from 'next/navigation'
import { adminHref } from '@/lib/admin-path'

/** Profil ve ayarlar tek sayfada: `/admin-panel/settings` */
export default function ProfilePage() {
  redirect(adminHref('/settings'))
}
