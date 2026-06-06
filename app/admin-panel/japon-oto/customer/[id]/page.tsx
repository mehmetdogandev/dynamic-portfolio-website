import { redirect } from 'next/navigation'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

type Props = { params: Promise<{ id: string }> }

export default async function LegacyJaponCustomerDetailRedirect({
  params,
}: Props) {
  const { id } = await params
  redirect(`${ADMIN_PANEL_PATH}/japon-oto/customers/${id}`)
}
