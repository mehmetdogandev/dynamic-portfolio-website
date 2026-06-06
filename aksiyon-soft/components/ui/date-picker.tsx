'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/index'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

function formatDate(date: Date | undefined): string {
  if (!date) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}.${month}.${year}`
}

function parseDate(input: string): Date | null {
  if (!input.trim()) {
    return null
  }

  const formats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  ]

  for (const format of formats) {
    const match = input.match(format)
    if (match) {
      const day = parseInt(match[1]!, 10)
      const month = parseInt(match[2]!, 10) - 1
      const year = parseInt(match[3]!, 10)

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        const date = new Date(year, month, day)
        if (
          date.getDate() === day &&
          date.getMonth() === month &&
          date.getFullYear() === year
        ) {
          return date
        }
      }
    }
  }

  const parsed = new Date(input)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder: string
  minDate?: Date
  maxDate?: Date
  minAgeYears?: number

  // Optional UI customizations (used by specific pages like Public Holidays)
  popoverClassName?: string
  forcePortal?: boolean
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  minAgeYears,
  popoverClassName,
  forcePortal = true,
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    value ? formatDate(value) : ''
  )
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [errorMessage, setErrorMessage] = React.useState<string>('')
  const prevValueRef = React.useRef<Date | undefined>(value)

  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      if (value) {
        setInputValue(formatDate(value))
        setMonth(value)
      } else {
        setInputValue('')
      }
      prevValueRef.current = value
    }
  }, [value])

  const formatDateInput = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '')

    let limitedDigits = digitsOnly.slice(0, 8)

    if (!limitedDigits) {
      return ''
    }

    if (limitedDigits.length >= 2) {
      const day = parseInt(limitedDigits.slice(0, 2), 10)
      if (day > 31) {
        limitedDigits = '31' + limitedDigits.slice(2)
      }
    }

    if (limitedDigits.length >= 4) {
      const month = parseInt(limitedDigits.slice(2, 4), 10)
      if (month > 12) {
        limitedDigits =
          limitedDigits.slice(0, 2) + '12' + limitedDigits.slice(4)
      }
    }

    let formatted = ''

    if (limitedDigits.length > 0) {
      formatted = limitedDigits.slice(0, 2)
      if (limitedDigits.length > 2) {
        formatted += '.'
      }
    }

    if (limitedDigits.length > 2) {
      formatted += limitedDigits.slice(2, 4)
      if (limitedDigits.length > 4) {
        formatted += '.'
      }
    }

    if (limitedDigits.length > 4) {
      formatted += limitedDigits.slice(4, 8)
    }

    return formatted
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart || 0

    const oldDigitsBeforeCursor = inputValue
      .slice(0, cursorPosition)
      .replace(/\D/g, '').length

    const formatted = formatDateInput(newValue)

    const formattedDigits = formatted.replace(/\D/g, '')
    const formattedDigitsLength = formattedDigits.length

    let newCursorPosition = formatted.length

    if (formattedDigitsLength > oldDigitsBeforeCursor) {
      let digitCount = 0
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i]!)) {
          digitCount++
          if (digitCount === formattedDigitsLength) {
            newCursorPosition = i + 1
            if (formatted[i + 1] === '.') {
              newCursorPosition = i + 2
            }
            break
          }
        }
      }
    } else if (formattedDigitsLength < oldDigitsBeforeCursor) {
      let digitCount = 0
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i]!)) {
          digitCount++
          if (digitCount === formattedDigitsLength) {
            newCursorPosition = i + 1
            break
          }
        }
      }
    }

    setInputValue(formatted)

    if (minAgeYears !== undefined) {
      if (formattedDigitsLength === 8) {
        const parsed = parseDate(formatted)
        if (parsed) {
          const today = new Date()
          const minAllowedDate = new Date()
          minAllowedDate.setFullYear(today.getFullYear() - minAgeYears)

          if (parsed > minAllowedDate) {
            setErrorMessage(`Personel ${minAgeYears} yaşından küçük olamaz`)
          } else {
            setErrorMessage('')
          }
        } else {
          setErrorMessage('')
        }
      } else {
        setErrorMessage('')
      }
    }

    setTimeout(() => {
      const input = e.target
      if (input) {
        input.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handleInputBlur = () => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      onChange(undefined)
      setInputValue('')
      setErrorMessage('')
      return
    }

    const parsed = parseDate(trimmed)
    if (parsed) {
      // Check if date is within allowed range
      if (minDate && parsed < minDate) {
        if (value) {
          setInputValue(formatDate(value))
        } else {
          setInputValue('')
        }
        setErrorMessage('')
        return
      }

      // Age validation if enabled
      if (minAgeYears !== undefined) {
        const today = new Date()
        const minAllowedDate = new Date()
        minAllowedDate.setFullYear(today.getFullYear() - minAgeYears)

        if (parsed > minAllowedDate) {
          setErrorMessage(`Personel ${minAgeYears} yaşından küçük olamaz`)
          // Keep the entered value visible and update form state
          onChange(parsed)
          return
        }
      }

      if (maxDate && parsed > maxDate) {
        if (value) {
          setInputValue(formatDate(value))
        } else {
          setInputValue('')
        }
        setErrorMessage('')
        return
      }

      setErrorMessage('')
      onChange(parsed)
      setInputValue(formatDate(parsed))
      setMonth(parsed)
    } else {
      setErrorMessage('')
      if (value) {
        setInputValue(formatDate(value))
      } else {
        setInputValue('')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInputBlur()
      return
    }

    if (['Backspace', 'Delete', 'Tab', 'Escape'].includes(e.key)) {
      return
    }

    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return
    }

    if (
      [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key)
    ) {
      return
    }

    if (/\d/.test(e.key) || e.key === '.') {
      const currentLength = inputValue.replace(/[^\d]/g, '').length
      if (/\d/.test(e.key) && currentLength >= 8) {
        e.preventDefault()
        return
      }
      return
    }

    e.preventDefault()
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const formatted = formatDateInput(pastedText)
    setInputValue(formatted)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      if (minAgeYears !== undefined) {
        const today = new Date()
        const minAllowedDate = new Date()
        minAllowedDate.setFullYear(today.getFullYear() - minAgeYears)

        if (date > minAllowedDate) {
          setErrorMessage(`Personel ${minAgeYears} yaşından küçük olamaz`)
          onChange(date)
          setInputValue(formatDate(date))
          setMonth(date)
          setOpen(false)
          return
        }
      }

      setErrorMessage('')
      onChange(date)
      setInputValue(formatDate(date))
      setMonth(date)
    } else {
      setErrorMessage('')
      onChange(undefined)
      setInputValue('')
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="space-y-1">
        <Input
          id="date"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          className={
            errorMessage
              ? 'bg-background pr-10 border-destructive'
              : 'bg-background pr-10'
          }
        />
        {errorMessage && (
          <p className="text-sm text-destructive mt-1">{errorMessage}</p>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Tarih seç</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn('w-auto overflow-hidden p-0', popoverClassName)}
          align="end"
          alignOffset={-8}
          sideOffset={10}
          forcePortal={forcePortal}
        >
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            month={month}
            onMonthChange={setMonth}
            onSelect={handleCalendarSelect}
            fromDate={minDate}
            {...(maxDate ? { toDate: maxDate } : {})}
            {...(fromYear ? { fromYear } : {})}
            {...(toYear ? { toYear } : {})}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
