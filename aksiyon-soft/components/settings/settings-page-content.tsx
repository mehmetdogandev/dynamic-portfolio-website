'use client'

import { useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { AccountProfileSection } from '@/components/settings/account-profile-section'

export function SettingsPageContent() {
  const trpc = useTRPC()
  const pathname = usePathname()
  const { data: user } = useQuery(trpc.user.me.queryOptions())

  const scrollToAccountHash = useCallback(() => {
    if (typeof window === 'undefined') return
    const id = window.location.hash.slice(1)
    if (id !== 'profil') return
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

  useEffect(() => {
    scrollToAccountHash()
  }, [pathname, scrollToAccountHash])

  useEffect(() => {
    const onHashChange = () => scrollToAccountHash()
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [scrollToAccountHash])

  if (!user) return null

  return (
    <div className="min-h-dvh bg-muted/25 dark:bg-background">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-12"
      >
        <header className="border-b border-border/70 pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Hesap merkezi
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Hesabım
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Profil kartındaki kısayollar üzerinden yetkilerinizi, aktif
            oturumlarınızı ve şifre güvenliğinizi yönetin.
          </p>
        </header>

        <AccountProfileSection />
      </motion.div>
    </div>
  )
}
