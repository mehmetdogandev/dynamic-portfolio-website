'use client'

import * as React from 'react'
import { X, Check, ChevronsUpDown } from 'lucide-react'
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

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  className?: string
  /** Use portal for popover (needed inside dialogs to avoid clipping) */
  forcePortal?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seçin...',
  icon: Icon,
  disabled = false,
  className,
  forcePortal = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleClearAll = (e: React.SyntheticEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const handleSelectAll = () => {
    onChange(options.map((opt) => opt.value))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-9', className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1">
            {Icon && <Icon className="h-4 w-4" />}
            <span
              className={selected.length === 0 ? 'text-muted-foreground' : ''}
            >
              {selected.length === 0
                ? placeholder
                : `${placeholder} (${selected.length})`}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearAll}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleClearAll(e as unknown as React.MouseEvent)
                  }
                }}
                className="rounded-full hover:bg-muted p-1 inline-flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-full p-0"
        align="start"
        forcePortal={forcePortal}
      >
        <Command>
          <CommandInput placeholder="Ara..." />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {/* Select All / Clear All buttons */}
              <div className="flex gap-1 p-1 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={handleSelectAll}
                  disabled={selected.length === options.length}
                >
                  Tümünü Seç
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={handleClearAll}
                  disabled={selected.length === 0}
                >
                  Temizle
                </Button>
              </div>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value)
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
