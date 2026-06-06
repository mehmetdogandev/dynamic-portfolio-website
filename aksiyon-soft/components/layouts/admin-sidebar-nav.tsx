'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useNavigationPermissions } from '@/lib/hooks/use-rbac'
import { useAdminNavActive } from '@/lib/hooks/use-admin-nav-active'
import { useAdminSidebarScrollToActive } from '@/lib/hooks/use-admin-sidebar-scroll'
import {
  readSiteSubgroupPersisted,
  useAdminSidebarGroupsPersist,
  writeSiteSubgroupPersisted,
} from '@/lib/hooks/use-admin-sidebar-groups-persist'
import {
  navigationItems,
  generalItems,
  siteManagementNavBlocks,
  japonOtoItems,
  radioMobileItems,
  adminNavGroupMeta,
  type AdminNavItem,
  type SiteManagementNavBlock,
} from '@/lib/navigation/admin-nav'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

function siteBlockIsVisible(
  block: SiteManagementNavBlock,
  isItemAccessible: (item: AdminNavItem) => boolean
): boolean {
  if (block.type === 'item') return isItemAccessible(block.item)
  return block.subgroup.items.some(isItemAccessible)
}

export function AdminSidebarNav() {
  const { data: permissions, isLoading } = useNavigationPermissions()
  const { isItemActive, activeGroups, pathname } = useAdminNavActive()

  useAdminSidebarScrollToActive(pathname)

  const { isGroupOpen, setGroupOpen } =
    useAdminSidebarGroupsPersist(activeGroups)

  const [siteSubgroupOpen, setSiteSubgroupOpen] = useState<
    Record<string, boolean>
  >({})
  const [siteSubgroupHydrated, setSiteSubgroupHydrated] = useState(false)

  useEffect(() => {
    setSiteSubgroupOpen(readSiteSubgroupPersisted())
    setSiteSubgroupHydrated(true)
  }, [])

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

  const home = navigationItems[0]
  const generalFiltered = generalItems.filter(isItemAccessible)
  const siteBlocksToShow = siteManagementNavBlocks.filter((block) =>
    siteBlockIsVisible(block, isItemAccessible)
  )
  const japonOtoFiltered = japonOtoItems.filter(isItemAccessible)
  const radioMobileFiltered = radioMobileItems.filter(isItemAccessible)
  const showGeneral = generalFiltered.length > 0
  const showSite = siteBlocksToShow.length > 0
  const showJaponOto = japonOtoFiltered.length > 0
  const showRadioMobile = radioMobileFiltered.length > 0

  return (
    <>
      <SidebarGroup className="px-2 pb-0">
        {home ? (
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(home.href)}
                  className="min-h-11 md:min-h-10"
                >
                  <Link href={home.href}>
                    <home.icon className="size-4 shrink-0" />
                    <span>{home.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        ) : null}
      </SidebarGroup>

      {showGeneral ? (
        <Collapsible
          open={isGroupOpen('general')}
          onOpenChange={(open) => setGroupOpen('general', open)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 text-left outline-none ring-sidebar-ring',
                'h-8 text-xs font-medium text-sidebar-foreground/70',
                'hover:bg-sidebar-accent/40 focus-visible:ring-2',
                'group-data-[collapsible=icon]:hidden',
                '[&[data-state=open]_svg]:rotate-180'
              )}
            >
              <span className="flex min-w-0 flex-1 items-center">
                {adminNavGroupMeta.general.label}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {generalFiltered.map((item) => {
                    const Icon = item.icon
                    const active = isItemActive(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="min-h-11 md:min-h-10"
                        >
                          <Link href={item.href}>
                            <Icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ) : null}

      {showSite ? (
        <Collapsible
          open={isGroupOpen('siteManagement')}
          onOpenChange={(open) => setGroupOpen('siteManagement', open)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 text-left outline-none ring-sidebar-ring',
                'h-8 text-xs font-medium text-sidebar-foreground/70',
                'hover:bg-sidebar-accent/40 focus-visible:ring-2',
                'group-data-[collapsible=icon]:hidden',
                '[&[data-state=open]_svg]:rotate-180'
              )}
            >
              <span className="flex min-w-0 flex-1 items-center">
                {adminNavGroupMeta.siteManagement.label}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {siteBlocksToShow.map((block) => {
                    if (block.type === 'item') {
                      const item = block.item
                      const Icon = item.icon
                      const active = isItemActive(item.href)
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            className="min-h-11 md:min-h-10"
                          >
                            <Link href={item.href}>
                              <Icon className="size-4 shrink-0" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    }

                    const sub = block.subgroup
                    const filtered = sub.items.filter(isItemAccessible)
                    if (filtered.length === 0) return null

                    const SubIcon = sub.icon
                    const hasActiveChild = filtered.some((i) =>
                      isItemActive(i.href)
                    )
                    const subOpen = hasActiveChild
                      ? true
                      : siteSubgroupHydrated
                        ? (siteSubgroupOpen[sub.id] ?? false)
                        : false

                    return (
                      <SidebarMenuItem key={sub.id} className="p-0">
                        <Collapsible
                          open={subOpen}
                          onOpenChange={(open) => {
                            if (hasActiveChild) return
                            setSiteSubgroupOpen((prev) => {
                              const next = { ...prev, [sub.id]: open }
                              writeSiteSubgroupPersisted(next)
                              return next
                            })
                          }}
                          className="group/site-sub w-full"
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              type="button"
                              isActive={hasActiveChild}
                              className={cn(
                                'min-h-11 w-full md:min-h-10',
                                '[&[data-state=open]_svg:last-child]:rotate-180'
                              )}
                            >
                              <SubIcon className="size-4 shrink-0" />
                              <span className="flex-1 truncate text-left">
                                {sub.label}
                              </span>
                              <ChevronDown
                                aria-hidden
                                className="size-4 shrink-0 opacity-70 transition-transform duration-200"
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {filtered.map((item) => {
                                const Icon = item.icon
                                const active = isItemActive(item.href)
                                return (
                                  <SidebarMenuSubItem key={item.href}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={active}
                                    >
                                      <Link href={item.href}>
                                        <Icon className="size-4 shrink-0" />
                                        <span>{item.title}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ) : null}

      {showRadioMobile ? (
        <Collapsible
          open={isGroupOpen('radioMobile')}
          onOpenChange={(open) => setGroupOpen('radioMobile', open)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 text-left outline-none ring-sidebar-ring',
                'h-8 text-xs font-medium text-sidebar-foreground/70',
                'hover:bg-sidebar-accent/40 focus-visible:ring-2',
                activeGroups.radioMobile && 'text-sidebar-foreground',
                'group-data-[collapsible=icon]:hidden',
                '[&[data-state=open]_svg]:rotate-180'
              )}
            >
              <span className="flex min-w-0 flex-1 items-center">
                {adminNavGroupMeta.radioMobile.label}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {radioMobileFiltered.map((item) => {
                    const Icon = item.icon
                    const active = isItemActive(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="min-h-11 md:min-h-10"
                        >
                          <Link href={item.href}>
                            <Icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ) : null}

      {showJaponOto ? (
        <Collapsible
          open={isGroupOpen('japonOto')}
          onOpenChange={(open) => setGroupOpen('japonOto', open)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <CollapsibleTrigger
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 text-left outline-none ring-sidebar-ring',
                'h-8 text-xs font-medium text-sidebar-foreground/70',
                'hover:bg-sidebar-accent/40 focus-visible:ring-2',
                'group-data-[collapsible=icon]:hidden',
                '[&[data-state=open]_svg]:rotate-180'
              )}
            >
              <span className="flex min-w-0 flex-1 items-center">
                {adminNavGroupMeta.japonOto.label}
              </span>
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-sidebar-foreground/70 transition-transform duration-200"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {japonOtoFiltered.map((item) => {
                    const Icon = item.icon
                    const active = isItemActive(item.href)
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className="min-h-11 md:min-h-10"
                        >
                          <Link href={item.href}>
                            <Icon className="size-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      ) : null}
    </>
  )
}
