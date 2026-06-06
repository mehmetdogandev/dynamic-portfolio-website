import { redirect } from 'next/navigation'
import { adminHref } from '@/lib/admin-path'

export default function AboutEditRedirectPage() {
  redirect(adminHref('/hakkimda/profile'))
}
