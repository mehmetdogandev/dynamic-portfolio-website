'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface UseServerTableSearchOptions {
  initialValue?: string
  debounceMs?: number
  paramKey?: string
  syncToUrl?: boolean
  onDebouncedChange?: (value: string) => void
}

interface UseServerTableSearchResult {
  search: string
  debouncedSearch: string
  setSearch: (value: string) => void
  handleSearchChange: (value: string) => void
  clearSearch: () => void
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function useServerTableSearch({
  initialValue = '',
  debounceMs = 300,
  paramKey = 'search',
  syncToUrl = true,
  onDebouncedChange,
}: UseServerTableSearchOptions = {}): UseServerTableSearchResult {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstSync = useRef(true)

  const initialFromUrl = useMemo(() => {
    if (!syncToUrl) {
      return initialValue
    }
    const paramValue = searchParams?.get(paramKey)
    return paramValue ?? initialValue
  }, [initialValue, paramKey, searchParams, syncToUrl])

  const [search, setSearchState] = useState(initialFromUrl)

  // Keep local state in sync when navigation updates the URL
  useEffect(() => {
    if (!syncToUrl) {
      return
    }
    setSearchState(initialFromUrl)
  }, [initialFromUrl, syncToUrl])

  const debouncedSearch = useDebouncedValue(search, debounceMs)

  useEffect(() => {
    onDebouncedChange?.(debouncedSearch)
  }, [debouncedSearch, onDebouncedChange])

  useEffect(() => {
    if (!syncToUrl || !router || !pathname) {
      return
    }

    // Skip syncing on first render to avoid replacing history unnecessarily
    if (isFirstSync.current) {
      isFirstSync.current = false
      return
    }

    const params = new URLSearchParams(searchParams?.toString() ?? '')
    const currentValue = searchParams?.get(paramKey) ?? ''

    if ((debouncedSearch || '') === currentValue) {
      return
    }

    if (debouncedSearch) {
      params.set(paramKey, debouncedSearch)
    } else {
      params.delete(paramKey)
    }

    // Use %20 instead of + for spaces (cleaner URL, avoids parsing edge cases)
    const queryString = params.toString().replace(/\+/g, '%20')
    const target = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(target, { scroll: false })
  }, [debouncedSearch, syncToUrl, router, pathname, paramKey, searchParams])

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchState(value)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchState('')
  }, [])

  return {
    search,
    debouncedSearch,
    setSearch,
    handleSearchChange,
    clearSearch,
  }
}
