import { redirect } from 'next/navigation'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

export default function LegacyJaponCustomerRedirect() {
  redirect(`${ADMIN_PANEL_PATH}/japon-oto/customers`)
}
