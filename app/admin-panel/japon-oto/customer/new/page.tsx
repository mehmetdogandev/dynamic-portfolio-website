import { redirect } from 'next/navigation'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export default function LegacyJaponCustomerNewRedirect() {
  redirect(`${ADMIN_PANEL_PATH}/japon-oto/operations/new`)
}
