'use client'

import * as React from 'react'
import { CalendarIcon, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function parseDateTime(input: string): Date | null {
  if (!input.trim()) {
    return null
  }

  // Try datetime-local format first (YYYY-MM-DDTHH:mm)
  const datetimeLocalMatch = input.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  )
  if (datetimeLocalMatch) {
    const year = parseInt(datetimeLocalMatch[1]!, 10)
    const month = parseInt(datetimeLocalMatch[2]!, 10) - 1
    const day = parseInt(datetimeLocalMatch[3]!, 10)
    const hours = parseInt(datetimeLocalMatch[4]!, 10)
    const minutes = parseInt(datetimeLocalMatch[5]!, 10)

    const date = new Date(year, month, day, hours, minutes)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Try format: DD.MM.YYYY HH:mm
  const formatMatch = input.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/
  )
  if (formatMatch) {
    const day = parseInt(formatMatch[1]!, 10)
    const month = parseInt(formatMatch[2]!, 10) - 1
    const year = parseInt(formatMatch[3]!, 10)
    const hours = parseInt(formatMatch[4]!, 10)
    const minutes = parseInt(formatMatch[5]!, 10)

    if (
      day >= 1 &&
      day <= 31 &&
      month >= 0 &&
      month <= 11 &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      const date = new Date(year, month, day, hours, minutes)
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date
      }
    }
  }

  // Try just date formats
  const dateFormats = [
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
  ]

  for (let i = 0; i < dateFormats.length; i++) {
    const match = input.match(dateFormats[i]!)
    if (match) {
      const day =
        i === 2
          ? parseInt(match[3]!, 10) // YYYY-MM-DD
          : parseInt(match[1]!, 10)
      const month =
        i === 2 ? parseInt(match[2]!, 10) - 1 : parseInt(match[2]!, 10) - 1
      const year = i === 2 ? parseInt(match[1]!, 10) : parseInt(match[3]!, 10)

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

  // Try parsing as ISO string
  const parsed = new Date(input)
  if (!isNaN(parsed.getTime())) {
    return parsed
  }

  return null
}

function formatDateTime(date: Date | undefined): string {
  if (!date) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}.${month}.${year} ${hours}:${minutes}`
}

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** When true, renders calendar popover in a portal (use inside dialogs to avoid clipping) */
  forceCalendarPortal?: boolean
  /** Minimum selectable date (dates before this are disabled) */
  minDate?: Date
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Tarih ve saat seçiniz',
  disabled = false,
  className,
  forceCalendarPortal = true,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    value ? formatDateTime(value) : ''
  )
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value
  )
  const [timeValue, setTimeValue] = React.useState(
    value
      ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
      : ''
  )
  const prevValueRef = React.useRef<Date | undefined>(value)

  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      if (value) {
        setInputValue(formatDateTime(value))
        setMonth(value)
        setSelectedDate(value)
        setTimeValue(
          `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
        )
      } else {
        setInputValue('')
        setSelectedDate(undefined)
        setTimeValue('')
      }
      prevValueRef.current = value
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
  }

  const handleInputBlur = () => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      onChange(undefined)
      setInputValue('')
      setSelectedDate(undefined)
      setTimeValue('')
      return
    }

    const parsed = parseDateTime(trimmed)
    if (parsed) {
      onChange(parsed)
      setInputValue(formatDateTime(parsed))
      setMonth(parsed)
      setSelectedDate(parsed)
      setTimeValue(
        `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
      )
    } else {
      if (value) {
        setInputValue(formatDateTime(value))
      } else {
        setInputValue('')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInputBlur()
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      return
    }

    let newDate = date
    if (selectedDate) {
      newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        selectedDate.getHours(),
        selectedDate.getMinutes()
      )
    } else {
      const now = new Date()
      newDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        now.getHours(),
        now.getMinutes()
      )
    }

    setSelectedDate(newDate)
    setMonth(newDate)
    setTimeValue(
      `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`
    )
    onChange(newDate)
    setInputValue(formatDateTime(newDate))
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeInput = e.target.value
    setTimeValue(timeInput)

    if (!selectedDate) {
      return
    }

    const [hours, minutes] = timeInput.split(':').map(Number)
    if (
      !isNaN(hours) &&
      !isNaN(minutes) &&
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      const newDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes
      )
      setSelectedDate(newDate)
      onChange(newDate)
      setInputValue(formatDateTime(newDate))
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-background pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            disabled={disabled}
          >
            <CalendarIcon className="size-3.5" />
            <span className="sr-only">Tarih ve saat seç</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-auto overflow-hidden p-0',
            forceCalendarPortal && 'z-250'
          )}
          align="end"
          alignOffset={-8}
          sideOffset={10}
          forcePortal={forceCalendarPortal}
        >
          <div className="p-3 space-y-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
              {...(minDate ? { fromDate: minDate } : {})}
              disabled={
                minDate
                  ? (date) => {
                      const d = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      )
                      const m = new Date(
                        minDate.getFullYear(),
                        minDate.getMonth(),
                        minDate.getDate()
                      )
                      return d < m
                    }
                  : undefined
              }
            />
            <div className="space-y-2 border-t pt-3">
              <Label htmlFor="time" className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Saat
              </Label>
              <Input
                id="time"
                type="time"
                value={timeValue}
                onChange={handleTimeChange}
                className="w-full"
                step={60}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
