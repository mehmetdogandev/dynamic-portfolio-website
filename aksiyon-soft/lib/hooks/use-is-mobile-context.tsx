'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

const MOBILE_THRESHOLD = 1024 as const

interface MobileContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
}

const MobileContext = createContext<MobileContextType | undefined>(undefined)

interface MobileProviderProps {
  children: ReactNode
}

export function MobileProvider({ children }: MobileProviderProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Debounce resize events for better performance
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, 100)
    }

    // Use passive listener for better performance
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const isMobile = dimensions.width < MOBILE_THRESHOLD
  const isTablet =
    dimensions.width >= 768 && dimensions.width < MOBILE_THRESHOLD
  const isDesktop = dimensions.width >= MOBILE_THRESHOLD

  const value: MobileContextType = {
    isMobile,
    isTablet,
    isDesktop,
    width: dimensions.width,
    height: dimensions.height,
  }

  return (
    <MobileContext.Provider value={value}>{children}</MobileContext.Provider>
  )
}

export function useMobileContext() {
  const context = useContext(MobileContext)
  if (context === undefined) {
    throw new Error('useMobileContext must be used within a MobileProvider')
  }
  return context
}
