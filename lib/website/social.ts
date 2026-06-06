import { AtSign, Github, Linkedin, MessageCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const trim = (v: string | undefined) => (v?.trim() ? v.trim() : undefined)

export function getWebsiteSocialLinks(): Array<{
  name: string
  href: string
  icon: LucideIcon
}> {
  const out: Array<{ name: string; href: string; icon: LucideIcon }> = []
  const li = trim(process.env.NEXT_PUBLIC_WEBSITE_SOCIAL_LINKEDIN)
  if (li) out.push({ name: 'LinkedIn', href: li, icon: Linkedin })
  const gh = trim(process.env.NEXT_PUBLIC_WEBSITE_SOCIAL_GITHUB)
  if (gh) out.push({ name: 'GitHub', href: gh, icon: Github })
  const x = trim(process.env.NEXT_PUBLIC_WEBSITE_SOCIAL_X)
  if (x) out.push({ name: 'X', href: x, icon: AtSign })
  const wa = trim(process.env.NEXT_PUBLIC_WEBSITE_SOCIAL_WHATSAPP)
  if (wa) out.push({ name: 'WhatsApp', href: wa, icon: MessageCircle })
  return out
}
