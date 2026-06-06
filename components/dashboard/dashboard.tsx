'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LogOut,
  User,
  Settings,
  Bell,
  ChevronRight,
  Calendar,
  Shield,
} from 'lucide-react'
import { useTRPC } from '@/lib/trpc/client'

interface DashboardProps {
  className?: string
}

/**
 * Ana dashboard bileşeni - kullanıcı bilgilerini ve navigasyonu gösterir
 * Modern tasarım prensipleriyle oluşturulmuş responsive layout
 */
export function Dashboard({ className }: DashboardProps) {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  // Kullanıcı verilerini al
  const { data: user, isLoading, error } = useQuery(trpc.user.me.queryOptions())

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey(),
      })
    } catch (_error) {
      toast.error('Çıkış yapılırken bir hata oluştu')
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500">Bir hata oluştu</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Yeniden Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-gray-500">Kullanıcı bilgisi bulunamadı</p>
      </div>
    )
  }

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'K'

  return (
    <div
      className={cn(
        'min-h-dvh bg-linear-to-br from-christmasRed/5 via-snow to-christmasGreen/5',
        className
      )}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 py-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Ana Panel</h1>
              <div className="flex items-center space-x-2 md:hidden">
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Bildirimler</span>
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Ayarlar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="hidden items-center space-x-2 md:flex">
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Bildirimler</span>
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Ayarlar</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Çıkış</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Hoş Geldin Bölümü */}
          <Card className="bg-linear-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-white/20">
                    <AvatarFallback className="text-lg bg-white/10 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Hoş geldiniz
                      {user.name ? `, ${user.name}` : ''}!
                    </h2>
                    <p className="text-blue-100">
                      Bugün hesabınızda neler oluyor?
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Bugün</p>
                  <p className="text-lg font-semibold">
                    {new Date().toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kullanıcı Bilgi Kartı */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle>Hesap Bilgileri</CardTitle>
              </div>
              <CardDescription>
                Mevcut hesap detaylarınız ve oturum bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Kullanıcı ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded mt-1">
                      {user.id}
                    </p>
                  </div>

                  {user.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        E-posta
                      </label>
                      <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                    </div>
                  )}

                  {user.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Ad Soyad
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {user.displayUsername}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Durum
                    </label>
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Son Giriş
                    </label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-900">
                        {new Date().toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {/* username */}
                  <div className="">
                    <label className="text-sm font-medium text-gray-500">
                      Kullanıcı adı
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.username || 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hızlı İşlemler */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Hızlı İşlemler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Profil Ayarları
                      </h4>
                      <p className="text-sm text-gray-500">
                        Kişisel bilgilerinizi güncelleyin
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                        <Settings className="h-6 w-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Hesap Ayarları
                      </h4>
                      <p className="text-sm text-gray-500">
                        Hesap tercihlerinizi yönetin
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                        <Bell className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Bildirimler
                      </h4>
                      <p className="text-sm text-gray-500">
                        Uyarılarınızı yapılandırın
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * Dashboard yüklenme skeleton bileşeni
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-dvh bg-linear-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Hoş Geldin Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bilgi Kartı Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hızlı İşlemler Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
