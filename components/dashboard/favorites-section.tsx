'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  X,
  Sparkles,
  GitBranch,
  Globe,
  Search,
  Check,
  ArrowRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNavigationPermissions } from '@/lib/hooks/use-rbac'
import {
  navigationItems,
  generalItems,
  getAllSiteManagementNavItems,
  type AdminNavItem,
} from '@/lib/navigation/admin-nav'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const colorPalettes = [
  {
    color: 'from-[var(--admin-accent)]',
    bgColor: 'bg-[var(--admin-nav-hover)]',
    iconColor: 'text-[var(--admin-accent)]',
  },
  {
    color: 'from-[var(--admin-nav-active-bg)]',
    bgColor: 'bg-muted/30',
    iconColor: 'text-[var(--admin-nav-active-bg)]',
  },
  {
    color: 'from-[var(--admin-group-ops-from)]',
    bgColor: 'bg-[var(--admin-nav-hover)]',
    iconColor: 'text-[var(--admin-group-ops-from)]',
  },
  {
    color: 'from-[var(--admin-group-general-from)]',
    bgColor: 'bg-muted/30',
    iconColor: 'text-[var(--admin-group-general-from)]',
  },
  {
    color: 'from-[var(--admin-accent)]',
    bgColor: 'bg-card',
    iconColor: 'text-[var(--admin-accent-fg)]',
  },
  {
    color: 'from-[var(--admin-group-ops-to)]',
    bgColor: 'bg-[var(--admin-nav-hover)]',
    iconColor: 'text-[var(--admin-group-ops-to)]',
  },
]

const getColorForItem = (index: number) => {
  return colorPalettes[index % colorPalettes.length]
}

function normalizeSearch(s: string) {
  return s.trim().toLocaleLowerCase('tr-TR')
}

export function FavoritesSection() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [spotlightHref, setSpotlightHref] = useState<string | null>(null)
  const { data: permissions, isLoading } = useNavigationPermissions()
  const router = useRouter()

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data: dbHrefs } = useQuery({
    ...trpc.userFavorites.getHrefs.queryOptions(),
    staleTime: 60_000,
    retry: false,
  })

  const toggleMutation = useMutation(
    trpc.userFavorites.toggle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.userFavorites.getHrefs.queryKey(),
        })
      },
      onError: (err) => {
        console.error('Favorite toggle failed:', err)
      },
    })
  )

  useEffect(() => {
    setMounted(true)
    if (dbHrefs) {
      setFavorites(dbHrefs as string[])
    }
  }, [dbHrefs])

  useEffect(() => {
    if (!isAddDialogOpen) setAddSearch('')
  }, [isAddDialogOpen])

  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites)
  }

  const toggleFavorite = async (href: string) => {
    const currently = favorites.includes(href)
    if (currently) {
      saveFavorites(favorites.filter((f) => f !== href))
    } else {
      saveFavorites([...favorites, href])
    }

    try {
      await toggleMutation.mutateAsync({ href })
      try {
        const latest = await queryClient.fetchQuery(
          trpc.userFavorites.getHrefs.queryOptions()
        )
        if (Array.isArray(latest)) {
          setFavorites(latest as string[])
        }
      } catch {
        // ignore
      }
    } catch (e) {
      console.error('Toggle favorite failed', e)
      if (currently) {
        saveFavorites([...favorites, href])
      } else {
        saveFavorites(favorites.filter((f) => f !== href))
      }
    }
  }

  const removeFavorite = (href: string) => {
    void toggleFavorite(href)
  }

  const isItemAccessible = useCallback(
    (item: AdminNavItem) => {
      if (!item.requiredPermission) return true
      if (isLoading) return false
      return (
        permissions?.[item.requiredPermission as keyof typeof permissions] ||
        false
      )
    },
    [isLoading, permissions]
  )

  const allAccessibleItems = [
    ...navigationItems.filter(isItemAccessible),
    ...generalItems.filter(isItemAccessible),
    ...getAllSiteManagementNavItems().filter(isItemAccessible),
  ]

  const favoriteItems = allAccessibleItems.filter((item) =>
    favorites.includes(item.href)
  )

  const spotlightItem = useMemo(() => {
    if (favoriteItems.length === 0) return null
    const picked = spotlightHref
      ? favoriteItems.find((i) => i.href === spotlightHref)
      : null
    return picked ?? favoriteItems[0]!
  }, [favoriteItems, spotlightHref])

  const handleFavoriteClick = (item: AdminNavItem) => {
    router.push(item.href)
  }

  const q = normalizeSearch(addSearch)
  const navFiltered = useMemo(() => {
    const list = navigationItems.filter(isItemAccessible)
    if (!q) return list
    return list.filter((item) => normalizeSearch(item.title).includes(q))
  }, [q, isItemAccessible])

  const generalFiltered = useMemo(() => {
    const list = generalItems.filter(isItemAccessible)
    if (!q) return list
    return list.filter((item) => normalizeSearch(item.title).includes(q))
  }, [q, isItemAccessible])

  const siteFiltered = useMemo(() => {
    const list = getAllSiteManagementNavItems().filter(isItemAccessible)
    if (!q) return list
    return list.filter((item) => normalizeSearch(item.title).includes(q))
  }, [q, isItemAccessible])

  const noAddDialogResults =
    navFiltered.length === 0 &&
    generalFiltered.length === 0 &&
    siteFiltered.length === 0

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--admin-accent)]" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Hızlı erişim
          </h2>
          {favoriteItems.length > 0 ? (
            <Badge
              variant="secondary"
              className="border-border bg-muted text-xs text-foreground"
            >
              {favoriteItems.length}
            </Badge>
          ) : null}
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="size-5 text-[var(--admin-accent)]" />
                Kısayol ekle
              </DialogTitle>
              <DialogDescription>
                Arama yapın; satıra tıklayarak kısayolu ekleyin veya çıkarın.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Sayfa ara…"
                className="border-border bg-background pl-9"
                autoComplete="off"
              />
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
              {navFiltered.length > 0 ? (
                <div>
                  <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                    Ana menü
                  </h3>
                  <ul className="space-y-1">
                    {navFiltered.map((item) => {
                      const isFav = favorites.includes(item.href)
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(item.href)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                              isFav
                                ? 'border-[var(--admin-accent)] bg-[var(--admin-nav-hover)]'
                                : 'border-border bg-card hover:bg-muted/40'
                            )}
                          >
                            <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                              <Icon className="text-foreground size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {item.title}
                            </span>
                            {isFav ? (
                              <Check className="size-4 shrink-0 text-[var(--admin-accent)]" />
                            ) : (
                              <Plus className="text-muted-foreground size-4 shrink-0" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {generalFiltered.length > 0 ? (
                <div>
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                    <GitBranch className="size-3.5" />
                    Panel yönetimi
                  </h3>
                  <ul className="space-y-1">
                    {generalFiltered.map((item) => {
                      const isFav = favorites.includes(item.href)
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(item.href)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                              isFav
                                ? 'border-[var(--admin-accent)] bg-[var(--admin-nav-hover)]'
                                : 'border-border bg-card hover:bg-muted/40'
                            )}
                          >
                            <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                              <Icon className="text-foreground size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {item.title}
                            </span>
                            {isFav ? (
                              <Check className="size-4 shrink-0 text-[var(--admin-accent)]" />
                            ) : (
                              <Plus className="text-muted-foreground size-4 shrink-0" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {siteFiltered.length > 0 ? (
                <div>
                  <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                    <Globe className="size-3.5" />
                    Site yönetimi
                  </h3>
                  <ul className="space-y-1">
                    {siteFiltered.map((item) => {
                      const isFav = favorites.includes(item.href)
                      const Icon = item.icon
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            onClick={() => void toggleFavorite(item.href)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                              isFav
                                ? 'border-[var(--admin-accent)] bg-[var(--admin-nav-hover)]'
                                : 'border-border bg-card hover:bg-muted/40'
                            )}
                          >
                            <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
                              <Icon className="text-foreground size-4" />
                            </span>
                            <span className="min-w-0 flex-1 truncate font-medium">
                              {item.title}
                            </span>
                            {isFav ? (
                              <Check className="size-4 shrink-0 text-[var(--admin-accent)]" />
                            ) : (
                              <Plus className="text-muted-foreground size-4 shrink-0" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {noAddDialogResults ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Sonuç yok.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {favoriteItems.length === 0 ? (
        <Card className="border-border border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-dashed border-[var(--admin-accent)]/40 bg-[var(--admin-nav-hover)]">
              <Sparkles className="size-7 text-[var(--admin-accent)]" />
            </div>
            <h3 className="text-foreground text-base font-semibold">
              Henüz kısayol yok
            </h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-center text-sm">
              Sık kullandığınız modülleri ekleyin; şerit ve önizleme alanından
              tek dokunuşla açın.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              variant="outline"
              size="sm"
              className="mt-5 gap-2 border-[var(--admin-nav-active-bg)]"
            >
              <Plus className="size-3.5" />
              Kısayol ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
            <div className="flex w-max min-w-full gap-2 px-1">
              {favoriteItems.map((item, index) => {
                const Icon = item.icon
                const colors = getColorForItem(index)
                const isActive = spotlightItem?.href === item.href
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setSpotlightHref(item.href)}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                      isActive
                        ? 'border-[var(--admin-accent)] bg-[var(--admin-nav-hover)] shadow-sm'
                        : 'border-border bg-card hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        colors.bgColor
                      )}
                    >
                      <Icon className={cn('size-4', colors.iconColor)} />
                    </span>
                    <span className="max-w-[10rem] truncate font-medium">
                      {item.title}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {spotlightItem ? (
              <motion.div
                key={spotlightItem.href}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-border overflow-hidden bg-card shadow-sm">
                  <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 flex-1 gap-4">
                      {(() => {
                        const idx = favoriteItems.findIndex(
                          (i) => i.href === spotlightItem.href
                        )
                        const colors = getColorForItem(idx >= 0 ? idx : 0)
                        const Icon = spotlightItem.icon
                        return (
                          <div
                            className={cn(
                              'flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-inner',
                              colors.bgColor
                            )}
                          >
                            <Icon className={cn('size-7', colors.iconColor)} />
                          </div>
                        )
                      })()}
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          Önizleme
                        </p>
                        <h3 className="text-foreground mt-0.5 text-lg font-semibold tracking-tight">
                          {spotlightItem.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 max-w-lg text-sm leading-relaxed">
                          Bu modüle gitmek için düğmeyi kullanın veya üstteki
                          şeritten başka bir kısayol seçin.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch md:flex-row">
                      <Button
                        type="button"
                        className="gap-2 bg-[var(--admin-nav-active-bg)] text-[var(--admin-nav-active-fg)] hover:bg-[var(--admin-group-general-from)]"
                        onClick={() => handleFavoriteClick(spotlightItem)}
                      >
                        Sayfaya git
                        <ArrowRight className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="border-border shrink-0"
                        aria-label="Kısayolu kaldır"
                        onClick={() => removeFavorite(spotlightItem.href)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
