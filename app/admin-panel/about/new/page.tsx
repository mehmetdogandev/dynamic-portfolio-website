import { redirect } from 'next/navigation'
import { adminHref } from '@/lib/admin-path'

export default function AboutNewRedirectPage() {
  redirect(adminHref('/hakkimda/profile'))
}
