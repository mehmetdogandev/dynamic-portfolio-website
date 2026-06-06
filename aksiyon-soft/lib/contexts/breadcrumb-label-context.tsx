'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

interface BreadcrumbLabelContextType {
  /**
   * Map of path segments to custom labels.
   * Key: URL segment (e.g., UUID like "2a83a499-cbed-47eb-97db-6f9a88db05f0")
   * Value: Custom label to display (e.g., "Depo Aksaray")
   */
  labelOverrides: Record<string, string>
  setLabelOverride: (segment: string, label: string) => void
  clearLabelOverride: (segment: string) => void
  clearAllOverrides: () => void
}

const BreadcrumbLabelContext = createContext<
  BreadcrumbLabelContextType | undefined
>(undefined)

export function BreadcrumbLabelProvider({ children }: { children: ReactNode }) {
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>(
    {}
  )

  const setLabelOverride = useCallback((segment: string, label: string) => {
    setLabelOverrides((prev) => ({ ...prev, [segment]: label }))
  }, [])

  const clearLabelOverride = useCallback((segment: string) => {
    setLabelOverrides((prev) => {
      const { [segment]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllOverrides = useCallback(() => {
    setLabelOverrides({})
  }, [])

  const value = useMemo(
    () => ({
      labelOverrides,
      setLabelOverride,
      clearLabelOverride,
      clearAllOverrides,
    }),
    [labelOverrides, setLabelOverride, clearLabelOverride, clearAllOverrides]
  )

  return (
    <BreadcrumbLabelContext.Provider value={value}>
      {children}
    </BreadcrumbLabelContext.Provider>
  )
}

export function useBreadcrumbLabel() {
  const context = useContext(BreadcrumbLabelContext)
  if (context === undefined) {
    throw new Error(
      'useBreadcrumbLabel must be used within a BreadcrumbLabelProvider'
    )
  }
  return context
}

/**
 * Hook to get label overrides without throwing if context is not available.
 * Useful for components that may be rendered outside the provider.
 */
export function useBreadcrumbLabelSafe() {
  return useContext(BreadcrumbLabelContext)
}
