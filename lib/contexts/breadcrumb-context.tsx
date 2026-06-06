'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react'

interface BreadcrumbContextType {
  customLabel: string | null
  setCustomLabel: (label: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customLabel, setCustomLabelState] = useState<string | null>(null)

  const setCustomLabel = useCallback((label: string | null) => {
    setCustomLabelState((prev) => {
      // Sadece değer gerçekten değiştiyse state'i güncelle
      if (prev === label) return prev
      return label
    })
  }, [])

  const value = useMemo(
    () => ({
      customLabel,
      setCustomLabel,
    }),
    [customLabel, setCustomLabel]
  )

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  // Context her zaman mevcut olmalı çünkü BreadcrumbProvider DashboardLayout içinde
  // Ama yine de optional döndürelim ki hata fırlatmasın
  return context
}
