'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { type EntityOption } from './types'

interface EntityMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  options: EntityOption[]
  placeholder?: string
  disabled?: boolean
  maxSelections?: number
  compactMode?: boolean
}

export function EntityMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Seçim yapın',
  disabled = false,
  maxSelections,
  compactMode = false,
}: EntityMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (optionId: string) => {
    if (value.includes(optionId)) {
      onChange(value.filter((id) => id !== optionId))
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return
      }
      onChange([...value, optionId])
    }
  }

  const handleClear = () => {
    onChange([])
  }

  const handleSelectAll = () => {
    const allIds = options.map((option) => option.id)
    if (maxSelections && allIds.length > maxSelections) {
      onChange(allIds.slice(0, maxSelections))
    } else {
      onChange(allIds)
    }
  }

  const allSelected = options.length > 0 && value.length === options.length

  const parseName = (
    name: string
  ): { department: string; location: string | null } => {
    const match = name.match(/^(.+?)\s*\((.+?)\)$/)
    if (match) {
      return {
        department: match[1].trim(),
        location: match[2].trim(),
      }
    }
    return {
      department: name,
      location: null,
    }
  }

  // Format selected items for display in button
  const getDisplayText = () => {
    if (value.length === 0) {
      return <span className="text-muted-foreground">{placeholder}</span>
    }

    if (compactMode) {
      return (
        <span className="text-left text-sm">
          {value.length}{' '}
          {value.length === 1 ? 'seçenek seçildi' : 'seçenek seçildi'}
        </span>
      )
    }

    const selectedNames = options
      .filter((opt) => value.includes(opt.id))
      .map((opt) => {
        const words = opt.name.trim().split(/\s+/)
        if (words.length === 0) return opt.name
        if (words.length === 1) return words[0]
        const firstWord = words[0]
        const secondWordInitial = words[1].charAt(0).toUpperCase()
        return `${firstWord} ${secondWordInitial}.`
      })
    const displayText = selectedNames.join(', ')

    return (
      <span className="text-left text-[9px] sm:text-[10px] whitespace-normal leading-tight wrap-break-word">
        {displayText}
      </span>
    )
  }

  const renderOptionName = (name: string) => {
    if (compactMode) {
      const { department, location } = parseName(name)
      if (location) {
        return (
          <>
            <span className="text-left">{department}</span>
            <span className="text-muted-foreground text-right ml-auto">
              ({location})
            </span>
          </>
        )
      }
    }
    return <>{name}</>
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm"
            disabled={disabled}
          >
            <span className="flex-1 min-w-0 mr-1.5 sm:mr-2 text-left whitespace-normal wrap-break-word">
              {getDisplayText()}
            </span>
            <ChevronsUpDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50 ml-1.5 sm:ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Ara..." />
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            {/* Action buttons */}
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 border-b">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-[10px] sm:h-7 sm:px-2 sm:text-xs flex-1"
                onClick={handleSelectAll}
                disabled={disabled || allSelected}
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Tümü Seçili</span>
                    <span className="sm:hidden">Seçili</span>
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                    <span className="hidden sm:inline">Tümünü Seç</span>
                    <span className="sm:hidden">Tümü</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1 text-[10px] sm:h-7 sm:px-2 sm:text-xs flex-1"
                onClick={handleClear}
                disabled={disabled || value.length === 0}
              >
                <X className="h-3 w-3 sm:h-3 sm:w-3 sm:mr-1.5" />
                Temizle
              </Button>
            </div>
            <CommandGroup className="max-h-64 overflow-auto">
              {(compactMode
                ? [...options].sort((a, b) => {
                    const aSelected = value.includes(a.id)
                    const bSelected = value.includes(b.id)
                    if (aSelected && !bSelected) return -1
                    if (!aSelected && bSelected) return 1
                    return 0
                  })
                : options
              ).map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => handleSelect(option.id)}
                  className={cn(
                    'text-xs',
                    compactMode ? 'px-1.5 py-1 gap-1.5' : 'px-2 py-1.5 gap-2'
                  )}
                >
                  <Check
                    className={cn(
                      compactMode ? 'mr-1 h-3.5 w-3.5' : 'mr-2 h-4 w-4',
                      'shrink-0',
                      value.includes(option.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {compactMode && parseName(option.name).location ? (
                    <div className="flex items-center justify-between w-full min-w-0">
                      {renderOptionName(option.name)}
                    </div>
                  ) : (
                    <span className="flex-1 min-w-0">
                      {renderOptionName(option.name)}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
