'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useNavigationPermissions } from '@/lib/hooks/use-rbac'
import { useAdminNavActive } from '@/lib/hooks/use-admin-nav-active'
import {
  navigationItems,
  generalItems,
  getAllSiteManagementNavItems,
  japonOtoItems,
  radioMobileItems,
  type AdminNavItem,
} from '@/lib/navigation/admin-nav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'

function CtrlOrCmd() {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  return isMac ? '⌘' : 'Ctrl'
}

type AdminMenuSearchContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const AdminMenuSearchContext =
  createContext<AdminMenuSearchContextValue | null>(null)

export function AdminMenuSearchProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      const input = document.querySelector(
        '[data-slot="command-input"]'
      ) as HTMLInputElement | null
      input?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  const value = useMemo(() => ({ open, setOpen }), [open])

  return (
    <AdminMenuSearchContext.Provider value={value}>
      <AdminMenuSearchDialog />
      {children}
    </AdminMenuSearchContext.Provider>
  )
}

function AdminMenuSearchDialog() {
  const ctx = useContext(AdminMenuSearchContext)
  const router = useRouter()
  const { data: permissions, isLoading } = useNavigationPermissions()
  const { isItemActive } = useAdminNavActive()

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

  const allAccessibleItems = useMemo(() => {
    const items: AdminNavItem[] = []
    navigationItems.forEach((item) => {
      if (isItemAccessible(item)) items.push(item)
    })
    generalItems.forEach((item) => {
      if (isItemAccessible(item)) items.push(item)
    })
    getAllSiteManagementNavItems().forEach((item) => {
      if (isItemAccessible(item)) items.push(item)
    })
    japonOtoItems.forEach((item) => {
      if (isItemAccessible(item)) items.push(item)
    })
    radioMobileItems.forEach((item) => {
      if (isItemAccessible(item)) items.push(item)
    })
    return items
  }, [isItemAccessible])

  if (!ctx) return null
  const { open, setOpen } = ctx

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Menü ara</DialogTitle>
        </DialogHeader>
        <Command
          shouldFilter
          className="**:[[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput placeholder="Menü ara…" />
          <div className="flex items-center justify-end gap-1 border-b px-3 py-1.5 text-[10px] text-muted-foreground">
            <span className="mr-auto">Sayfaya git</span>
            <Kbd>{CtrlOrCmd()}</Kbd>
            <Kbd>L</Kbd>
          </div>
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup heading="Menü">
              {allAccessibleItems.map((item) => {
                const Icon = item.icon
                const active = isItemActive(item.href)
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${item.href}`}
                    onSelect={() => {
                      setOpen(false)
                      router.push(item.href)
                    }}
                    className={cn(
                      'cursor-pointer gap-2',
                      active && 'bg-accent/80'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.title}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function AdminMenuSearchTrigger() {
  const ctx = useContext(AdminMenuSearchContext)
  if (!ctx) {
    throw new Error(
      'AdminMenuSearchTrigger must be used within AdminMenuSearchProvider'
    )
  }
  const { setOpen } = ctx

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="shrink-0 gap-1.5 px-1.5 font-medium text-sidebar-foreground sm:px-2"
      onClick={() => setOpen(true)}
      aria-label="Menüde ara"
    >
      <Search className="size-4 shrink-0" />
    </Button>
  )
}
