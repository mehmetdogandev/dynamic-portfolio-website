'use client'

import { TRPCReactProvider } from '@/lib/trpc/client'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'
import { MobileProvider } from '@/lib/hooks/use-is-mobile-context'

interface ProvidersProps {
  children: ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <TRPCReactProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <MobileProvider>{children}</MobileProvider>
      </ThemeProvider>
    </TRPCReactProvider>
  )
}

export default Providers
