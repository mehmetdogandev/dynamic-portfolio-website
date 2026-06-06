/**
 * Date utility functions for consistent UTC handling
 *
 * All dates in the database are stored in UTC.
 * Frontend operates in Turkey timezone (UTC+3).
 * These utilities ensure consistent date handling across the system.
 */

const TURKEY_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC+3 in milliseconds

/**
 * Normalize any date to UTC midnight
 * Extracts the calendar date components and creates a new Date at UTC midnight
 *
 * @param date - Date to normalize (can be in any timezone)
 * @returns Date object at UTC midnight representing the same calendar date
 *
 * @example
 * // If date is "2025-11-12T03:00:00.000Z" (which is Nov 12 06:00 in Turkey)
 * // Returns "2025-11-12T00:00:00.000Z"
 */
export function normalizeToUTCMidnight(date: Date): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

/**
 * Normalize a date from database to UTC midnight
 * Database dates are already in UTC, but may have time components
 * This ensures we work with clean date boundaries
 *
 * @param date - Date from database
 * @returns Date object at UTC midnight
 */
export function normalizeFromDBDate(date: Date): Date {
  return normalizeToUTCMidnight(date)
}

/**
 * Convert UTC date to Turkey timezone for display purposes only
 * This is used when displaying dates to users in Turkey (UTC+3)
 *
 * @param utcDate - Date in UTC
 * @returns Date object adjusted to Turkey timezone (for display only)
 *
 * @example
 * // If utcDate is "2025-11-12T00:00:00.000Z"
 * // Returns a Date that when displayed shows Nov 12 in Turkey timezone
 */
export function toTurkeyDate(utcDate: Date): Date {
  // For display purposes, we add the offset to get the local representation
  // But we still work with UTC internally
  const turkeyTime = new Date(utcDate.getTime() + TURKEY_TIMEZONE_OFFSET_MS)
  return new Date(
    Date.UTC(
      turkeyTime.getUTCFullYear(),
      turkeyTime.getUTCMonth(),
      turkeyTime.getUTCDate(),
      turkeyTime.getUTCHours(),
      turkeyTime.getUTCMinutes(),
      turkeyTime.getUTCSeconds(),
      turkeyTime.getUTCMilliseconds()
    )
  )
}

/**
 * Get UTC date key in YYYY-MM-DD format
 * This is consistent with getDateKey in clocking-calendar/utils.ts
 *
 * @param date - Date to convert
 * @returns Date key string in YYYY-MM-DD format (UTC)
 */
export function getUTCDateKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convert a date from frontend (which may be in local timezone) to UTC midnight
 * Frontend sends dates that may be interpreted in local timezone
 * This ensures we convert them to UTC properly
 *
 * IMPORTANT: Calendar components (like react-day-picker) create Date objects
 * in local timezone representing calendar dates (e.g., 2026-01-15T00:00:00+03:00).
 * We must use LOCAL timezone methods (getFullYear, getMonth, getDate) to extract
 * the calendar date, NOT UTC methods or ISO string parsing (which would shift the date).
 *
 * @param date - Date from frontend (typically from Calendar component in local timezone)
 * @returns Date object at UTC midnight representing the same calendar date
 */
export function normalizeFrontendDateToUTC(date: Date): Date {
  // Check if date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided to normalizeFrontendDateToUTC')
  }

  // Use LOCAL timezone methods to extract calendar date components
  // Calendar components (react-day-picker) create Date objects in local timezone
  // representing the calendar date the user selected. We need to preserve that
  // calendar date when converting to UTC.
  const year = date.getFullYear() // Local timezone year
  const month = date.getMonth() // Local timezone month (0-indexed)
  const day = date.getDate() // Local timezone day

  // Create UTC Date object at midnight representing the same calendar date
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
}

/**
 * Get the start of day in UTC for a given date
 *
 * @param date - Date to get start of day for
 * @returns Date object at UTC midnight
 */
export function getStartOfDayUTC(date: Date): Date {
  return normalizeToUTCMidnight(date)
}

/**
 * Get the end of day in UTC for a given date
 *
 * @param date - Date to get end of day for
 * @returns Date object at UTC 23:59:59.999
 */
export function getEndOfDayUTC(date: Date): Date {
  const normalized = normalizeToUTCMidnight(date)
  return new Date(normalized.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/**
 * Parse a date from database (string or Date) as UTC
 * Database dates are stored in UTC, but when parsed with new Date() in frontend,
 * they may be interpreted in local timezone causing a shift.
 * This function ensures dates are parsed as UTC regardless of local timezone.
 *
 * @param dateInput - Date from database (can be string in ISO format, "YYYY-MM-DD HH:mm:ss", or Date object)
 * @returns Date object parsed as UTC (at UTC midnight if time component is 00:00:00)
 *
 * @example
 * // If DB returns "2026-01-21 00:00:00" (UTC)
 * // new Date("2026-01-21 00:00:00") might parse as local timezone (e.g., 2026-01-20 21:00:00 UTC+3)
 * // parseUTCDateFromDB("2026-01-21 00:00:00") returns Date at "2026-01-21T00:00:00.000Z"
 */
export function parseUTCDateFromDB(
  dateInput: Date | string | null | undefined
): Date {
  if (!dateInput) {
    throw new Error('Invalid date input: dateInput is null or undefined')
  }

  // If already a Date object, normalize it to UTC midnight
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      throw new Error('Invalid date: Date object is invalid')
    }
    return normalizeToUTCMidnight(dateInput)
  }

  // Handle string inputs
  if (typeof dateInput !== 'string') {
    throw new Error('Invalid date input: expected Date or string')
  }

  // Try ISO string format first (e.g., "2026-01-21T00:00:00.000Z" or "2026-01-21T21:00:00.000Z")
  if (dateInput.includes('T')) {
    const parsed = new Date(dateInput)
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid ISO date string: ${dateInput}`)
    }
    // Extract UTC date components to avoid timezone shift
    return new Date(
      Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
        0,
        0,
        0,
        0
      )
    )
  }

  // Handle "YYYY-MM-DD HH:mm:ss" format (PostgreSQL timestamp format)
  // This format is ambiguous - it doesn't specify timezone
  // We assume it's UTC since DB stores dates in UTC
  const timestampMatch = dateInput.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?$/
  )

  if (timestampMatch) {
    const year = parseInt(timestampMatch[1]!, 10)
    const month = parseInt(timestampMatch[2]!, 10) - 1 // Month is 0-indexed
    const day = parseInt(timestampMatch[3]!, 10)
    const hours = timestampMatch[4] ? parseInt(timestampMatch[4]!, 10) : 0
    const minutes = timestampMatch[5] ? parseInt(timestampMatch[5]!, 10) : 0
    const seconds = timestampMatch[6] ? parseInt(timestampMatch[6]!, 10) : 0
    const milliseconds = timestampMatch[7]
      ? parseInt(timestampMatch[7]!.padEnd(3, '0').substring(0, 3), 10)
      : 0

    // If time is 00:00:00, normalize to midnight
    if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
    }

    // Otherwise, preserve the time but ensure it's UTC
    return new Date(
      Date.UTC(year, month, day, hours, minutes, seconds, milliseconds)
    )
  }

  // Handle "YYYY-MM-DD" format
  const dateOnlyMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1]!, 10)
    const month = parseInt(dateOnlyMatch[2]!, 10) - 1
    const day = parseInt(dateOnlyMatch[3]!, 10)
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  }

  // Fallback: try parsing as-is and normalize
  const parsed = new Date(dateInput)
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string format: ${dateInput}`)
  }
  return normalizeToUTCMidnight(parsed)
}

/**
 * Format duration in milliseconds to human-readable Turkish string
 *
 * @param milliseconds - Duration in milliseconds (can be null or undefined)
 * @returns Formatted string like "2 saat 30 dakika" or "45 dakika", or "-" if null/undefined
 *
 * @example
 * formatDuration(9000000) // "2 saat 30 dakika"
 * formatDuration(2700000) // "45 dakika"
 * formatDuration(null) // "-"
 */
export function formatDuration(
  milliseconds: number | null | undefined
): string {
  if (milliseconds === null || milliseconds === undefined) {
    return '-'
  }

  const totalMinutes = Math.floor(milliseconds / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours === 0) {
    return `${remainingMinutes} dakika`
  } else if (remainingMinutes === 0) {
    return `${hours} saat`
  } else {
    return `${hours} saat ${remainingMinutes} dakika`
  }
}

/**
 * Format date-time value in Turkish locale using 24-hour clock.
 *
 * @param value - Date or ISO/string value or null
 * @param withDate - Include calendar date components when true (default)
 * @returns Formatted string like "12 Oca 2026 14:30" or just "14:30" if withDate=false, "-" when null/invalid
 */
export function formatDateTime24h(
  value: Date | string | null | undefined,
  withDate = true
): string {
  if (!value) return '-'
  const dt = typeof value === 'string' ? new Date(value) : value
  if (isNaN(dt.getTime())) return '-'

  const options: Intl.DateTimeFormatOptions = withDate
    ? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    : {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }

  return dt.toLocaleString('tr-TR', options)
}
