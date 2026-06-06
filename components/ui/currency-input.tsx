'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Format number as Turkish Lira
 * - Binlik ayırıcı: nokta (.) - 1.234
 * - Ondalık ayırıcı: virgül (,) - 1.234,56
 * - Kuruş: sabit 2 hane
 * Format: ₺1.234.567,89
 */
function formatTurkishLira(value: number): string {
  if (value === 0 || !value) return ''

  // Split integer and decimal parts
  const parts = value.toFixed(2).split('.')
  const integerPart = parts[0]!
  const decimalPart = parts[1] || '00'

  // Add thousand separators (nokta) to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Combine: integer part + virgül + decimal part (always 2 digits)
  return `₺${formattedInteger},${decimalPart}`
}

/**
 * Parse Turkish Lira formatted string to number
 * Removes all formatting and converts to numeric value
 */
function parseTurkishLira(formattedValue: string): number {
  // Remove currency symbol, spaces, and extract only digits
  const digits = formattedValue.replace(/[^\d]/g, '')
  if (!digits) return 0
  // Convert to number (divide by 100 for kuruş)
  return Number(digits) / 100
}

export interface CurrencyInputProps {
  value?: string | number
  onChange?: (value: string) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  error?: string
}

/**
 * Standalone currency input component with Turkish Lira formatting
 * - Can be used with or without react-hook-form
 * - Real-time currency formatting: ₺1.234.567,89
 * - Stores value as string with dot as decimal separator (e.g., "1234567.89")
 */
export function CurrencyInput({
  value,
  onChange,
  label,
  placeholder = '0',
  required = false,
  disabled = false,
  className,
  error,
}: CurrencyInputProps) {
  // Initialize display value from prop value
  const getInitialValue = () => {
    if (value === undefined || value === null || value === '') {
      return ''
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''
    return formatTurkishLira(numValue)
  }

  // Use reducer for formatted display value
  const [displayValue, setDisplayValue] = React.useReducer(
    (_: string, next: string) => {
      if (!next) return ''
      // Extract only digits from input
      const digits = next.replace(/\D/g, '')
      if (!digits) return ''
      // Convert to number (divide by 100 for kuruş)
      const numericValue = Number(digits) / 100
      // Format with Turkish Lira format
      return formatTurkishLira(numericValue)
    },
    getInitialValue()
  )

  // Sync display value when prop value changes externally
  React.useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue)) {
        const formatted = formatTurkishLira(numValue)
        if (formatted !== displayValue) {
          setDisplayValue(formatted)
        }
      }
    } else if (displayValue !== '') {
      setDisplayValue('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Handle change: update display and notify parent
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Update display value (formatted with Turkish Lira format)
    setDisplayValue(inputValue)
    // Parse to numeric value (with dot as decimal separator for DB)
    const numericValue = parseTurkishLira(inputValue)
    // Notify parent with string value (with dot as decimal separator)
    const stringValue =
      numericValue > 0 ? String(numericValue) : required ? '0' : ''
    onChange?.(stringValue)
  }

  // Handle focus: select all text for easy replacement
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  // Handle key down: prevent non-digit input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, tab, escape, enter, arrow keys
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
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
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return
    }
    // Only allow digits
    if (e.key.length === 1 && !/\d/.test(e.key)) {
      e.preventDefault()
    }
  }

  return (
    <div className={className}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="text-right font-medium"
      />
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  )
}
