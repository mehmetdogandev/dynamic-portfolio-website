'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/client'
import { toast } from 'sonner'
import { ChevronsUpDown, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { getUserDisplayInitials } from '@/lib/utils/user-initials'
import { adminHref } from '@/lib/admin-path'

const ACCOUNT_SETTINGS = adminHref('/settings')

export function AdminSidebarUserFooter() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const { data: user } = useQuery(trpc.user.me.queryOptions())
  const [mounted, setMounted] = React.useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false)

  const {
    data: profilePhotoUrl,
    isLoading: profilePhotoLoading,
    refetch: refetchProfilePhoto,
  } = useQuery({
    ...trpc.user.getProfilePhotoUrl.queryOptions({
      userId: user?.id,
      fileId: user?.image || undefined,
    }),
    enabled: !!user?.id && !!user?.image,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (user?.id && user?.image) {
      refetchProfilePhoto()
    }
  }, [user?.image, user?.id, refetchProfilePhoto])

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey(),
      })
      setLogoutDialogOpen(false)
      toast.success('Başarıyla çıkış yaptınız')
      router.refresh()
    } catch {
      toast.error('Çıkış yapılırken bir hata oluştu')
    }
  }

  if (!user || !mounted) return null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 w-full min-h-11 justify-start gap-2 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-11"
              >
                <Avatar className="size-9 shrink-0 rounded-md">
                  {user.image &&
                  profilePhotoUrl?.downloadUrl &&
                  !profilePhotoLoading ? (
                    <AvatarImage src={profilePhotoUrl.downloadUrl} alt="" />
                  ) : null}
                  <AvatarFallback className="rounded-md text-sm">
                    {getUserDisplayInitials(user.name, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.displayUsername}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              side="top"
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-md">
                    {user.image &&
                    profilePhotoUrl?.downloadUrl &&
                    !profilePhotoLoading ? (
                      <AvatarImage src={profilePhotoUrl.downloadUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="rounded-md text-xs">
                      {getUserDisplayInitials(user.name, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">
                      {user.displayUsername}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={ACCOUNT_SETTINGS} className="min-h-10">
                    <User className="size-4 opacity-70" />
                    Hesabım
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-10 text-destructive focus:text-destructive"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogOut className="size-4 opacity-70" />
                Çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış Yap</AlertDialogTitle>
            <AlertDialogDescription>
              Çıkış yapmak istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleLogout()}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Çıkış Yap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
