'use client'

import * as React from 'react'
import { useTRPC } from '@/lib/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { Loader } from 'lucide-react'
import { ForcePasswordResetDialog } from './force-password-reset-dialog'
import { authClient } from '@/lib/auth/client'
import { useQueryClient } from '@tanstack/react-query'
import { ADMIN_PANEL_PATH } from '@/lib/admin-path'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
}

/**
 * A wrapper component that handles authentication state and conditionally renders
 * content based on user authentication status.
 *
 * @param children - Content to render when user is authenticated
 * @param fallback - Content to render when user is not authenticated (login form)
 * @param loadingComponent - Content to render while checking authentication status
 */
export function AuthenticatedLayout({
  children,
  fallback,
  loadingComponent,
}: AuthenticatedLayoutProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [showForcePasswordReset, setShowForcePasswordReset] =
    React.useState(false)
  const [loginEmailForReset, setLoginEmailForReset] = React.useState<string>('')
  const [oldPasswordForReset, setOldPasswordForReset] =
    React.useState<string>('')

  const { data: user, isLoading } = useQuery({
    ...trpc.user.me.queryOptions(),
    retry: false, // Don't retry on auth failures
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  })

  // Check for force password reset flag after user is loaded
  React.useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const forceReset = localStorage.getItem('forcePasswordReset')
      const email = localStorage.getItem('forcePasswordResetEmail')
      const oldPassword = localStorage.getItem('forcePasswordResetOldPassword')

      if (forceReset === 'true' && email && oldPassword) {
        setLoginEmailForReset(email)
        setOldPasswordForReset(oldPassword)
        setShowForcePasswordReset(true)
      }
    }
  }, [user])

  const handlePasswordChanged = async () => {
    // Clear flags
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forcePasswordReset')
      localStorage.removeItem('forcePasswordResetEmail')
      localStorage.removeItem('forcePasswordResetOldPassword')
    }
    setShowForcePasswordReset(false)
    setLoginEmailForReset('')
    setOldPasswordForReset('')
    await queryClient.invalidateQueries({
      queryKey: trpc.user.me.queryKey(),
    })
  }

  const handleDialogClose = async () => {
    // Dialog kapatılırsa logout yap
    try {
      await authClient.signOut()
      await queryClient.invalidateQueries({
        queryKey: trpc.user.me.queryKey(),
      })
      // Clear flags
      if (typeof window !== 'undefined') {
        localStorage.removeItem('forcePasswordReset')
        localStorage.removeItem('forcePasswordResetEmail')
        localStorage.removeItem('forcePasswordResetOldPassword')
      }
      // Reload to show login page
      window.location.href = ADMIN_PANEL_PATH
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent || <AuthLoadingSpinner />
  }

  // If user is not authenticated, show fallback (login)
  if (!user) {
    return fallback || <div>Please log in to continue</div>
  }

  // User is authenticated, render children with password reset dialog
  return (
    <>
      {children}
      <ForcePasswordResetDialog
        open={showForcePasswordReset}
        loginEmail={loginEmailForReset}
        oldPassword={oldPasswordForReset}
        onPasswordChanged={handlePasswordChanged}
        onClose={handleDialogClose}
      />
    </>
  )
}

/**
 * Default loading spinner component
 */
function AuthLoadingSpinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50">
      <div className="text-center flex flex-col items-center space-y-4 justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12" />
        <p className="text-gray-600">Sistem Tarafından Kontrol Ediliyor...</p>
      </div>
    </div>
  )
}

/**
 * Higher-order component for pages that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode
    loadingComponent?: React.ReactNode
  }
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <AuthenticatedLayout
        fallback={options?.fallback}
        loadingComponent={options?.loadingComponent}
      >
        <Component {...props} />
      </AuthenticatedLayout>
    )
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`

  return AuthenticatedComponent
}

export default AuthenticatedLayout
