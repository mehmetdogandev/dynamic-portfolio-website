'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type ComboboxItem = {
  value: string
  label: string | React.ReactNode
}

type ComboboxProps = {
  items?: ComboboxItem[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  /** Eğer verilirse server-side search yapılır */
  onQueryChange?: (query: string) => void
  isLoading?: boolean
  debounceTime?: number
  enabled?: boolean
}

export function Combobox({
  items = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  className,
  onQueryChange,
  isLoading = false,
  debounceTime = 300,
  enabled = true,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  // Debounce için useRef ve useEffect
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleQueryChange = (val: string) => {
    setQuery(val)

    if (onQueryChange) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onQueryChange(val)
      }, debounceTime)
    }
  }

  // Reset query when popover closes
  React.useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const filteredItems = React.useMemo(() => {
    // Eğer onQueryChange varsa (server-side search kullanılıyorsa),
    // client-side filtering yapma - sadece server'dan gelen items'ı göster
    if (onQueryChange) {
      return items
    }

    // Client-side search için filtreleme yap
    if (!query) {
      return items
    }
    return items.filter((item) => {
      // If label is a string, filter by it
      if (typeof item.label === 'string') {
        return item.label.toLowerCase().includes(query.toLowerCase())
      }
      // If label is ReactNode, always include it
      return true
    })
  }, [items, query, onQueryChange])

  const selectedItem = items.find((item) => item.value === value)
  const selectedLabel = selectedItem?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={!enabled || (isLoading && !open)}
        >
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <span className="truncate">
              {typeof selectedLabel === 'string'
                ? selectedLabel
                : selectedLabel || placeholder}
            </span>
            {isLoading && !open && (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0 z-9999"
        align="start"
        forcePortal
        onWheel={(e) => {
          e.stopPropagation()
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            className="h-9"
            value={query}
            onValueChange={handleQueryChange}
          />
          <CommandList
            className="max-h-60 overflow-y-auto overflow-x-hidden"
            style={{ overscrollBehavior: 'contain' }}
          >
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader className="h-5 w-5 animate-spin" />
              </div>
            )}
            {!isLoading && filteredItems.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup key={items.map((i) => i.value).join(',')}>
              {filteredItems.map((item, index) => (
                <CommandItem
                  key={`${item.value}-${index}`}
                  value={item.value}
                  onSelect={(currentValue) => {
                    onChange?.(currentValue === value ? '' : currentValue)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {item.label}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
