import * as React from 'react'

import { cn } from '@/lib/utils/index'

function Input({
  className,
  type,
  lang,
  inputMode,
  step,
  onFocus,
  onBlur,
  onChange,
  onKeyDown,
  onInput,
  onWheel,
  value,
  ...props
}: React.ComponentProps<'input'>) {
  const isNumberType = type === 'number'
  const isControlled = value !== undefined
  const [numberDraft, setNumberDraft] = React.useState<string | null>(null)
  const isNumberDraftActive =
    isNumberType && isControlled && numberDraft !== null

  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (isNumberType) {
        setNumberDraft(event.currentTarget.value)
      }

      if (isNumberType && event.currentTarget.value === '0') {
        event.currentTarget.select()
      }

      onFocus?.(event)
    },
    [isNumberType, onFocus]
  )

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      if (isNumberType) {
        setNumberDraft(null)
      }

      onBlur?.(event)
    },
    [isNumberType, onBlur]
  )

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isNumberType) {
        setNumberDraft(event.currentTarget.value)
      }

      onChange?.(event)
    },
    [isNumberType, onChange]
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isNumberType && (event.key === ',' || event.key === '.')) {
        const input = event.currentTarget
        const currentValue = input.value
        const { selectionStart, selectionEnd } = input

        // Some browsers don't support selection APIs on <input type="number">.
        // In that case, avoid blocking decimal entry.
        if (selectionStart === null || selectionEnd === null) {
          if (event.key === ',') {
            event.preventDefault()

            if (currentValue.includes('.')) {
              onKeyDown?.(event)
              return
            }

            const insertion =
              currentValue.trim() === '' || currentValue === '-' ? '0.' : '.'
            input.value = `${currentValue}${insertion}`
            input.dispatchEvent(new Event('input', { bubbles: true }))
          } else if (event.key === '.' && currentValue.includes('.')) {
            event.preventDefault()
          }

          onKeyDown?.(event)
          return
        }

        event.preventDefault()

        const before = currentValue.slice(0, selectionStart)
        const selected = currentValue.slice(selectionStart, selectionEnd)
        const after = currentValue.slice(selectionEnd)
        const hasDecimalOutsideSelection =
          before.includes('.') || after.includes('.')

        if (hasDecimalOutsideSelection) {
          const decimalIndex = currentValue.indexOf('.')
          const nextCursor = Math.min(decimalIndex + 1, currentValue.length)
          input.setSelectionRange(nextCursor, nextCursor)
          onKeyDown?.(event)
          return
        }

        const shouldPrefixZero =
          currentValue.trim() === '' ||
          currentValue === '-' ||
          (selected === currentValue && (selected === '0' || selected === '-0'))

        const insertion = shouldPrefixZero ? '0.' : '.'
        const nextValue = `${before}${insertion}${after}`

        if (nextValue !== currentValue) {
          input.value = nextValue
          const nextCursor = before.length + insertion.length
          input.setSelectionRange(nextCursor, nextCursor)
          input.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }

      onKeyDown?.(event)
    },
    [isNumberType, onKeyDown]
  )

  const handleInput = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      if (isNumberType && event.currentTarget.value.includes(',')) {
        const input = event.currentTarget
        const { selectionStart } = input
        input.value = input.value.replace(/,/g, '.')

        if (selectionStart !== null) {
          input.setSelectionRange(selectionStart, selectionStart)
        }
      }

      if (isNumberType && isControlled) {
        setNumberDraft(event.currentTarget.value)
      }

      onInput?.(event)
    },
    [isControlled, isNumberType, onInput]
  )

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLInputElement>) => {
      if (isNumberType && document.activeElement === event.currentTarget) {
        event.currentTarget.blur()
      }

      onWheel?.(event)
    },
    [isNumberType, onWheel]
  )

  return (
    <input
      type={type}
      value={isNumberDraftActive ? numberDraft : value}
      lang={isNumberType ? (lang ?? 'en-US') : lang}
      inputMode={isNumberType ? (inputMode ?? 'decimal') : inputMode}
      step={isNumberType ? (step ?? 'any') : step}
      data-slot="input"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onWheel={handleWheel}
      className={cn(
        'flex h-12 w-full min-w-0 rounded-xs border border-input bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-none transition-colors outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 selection:bg-primary selection:text-primary-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  )
}

export { Input }
