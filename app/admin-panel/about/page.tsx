import { redirect } from 'next/navigation'
import { adminHref } from '@/lib/admin-path'

export default function AboutRedirectPage() {
  redirect(adminHref('/hakkimda/profile'))
}
