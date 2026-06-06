import type { EnumMapping } from '../types'

/** Display label (Excel) → DB value */
export function mapEnumToDb(
  displayValue: string,
  mapping: EnumMapping[]
): string | null {
  const trimmed = displayValue.trim()
  const found = mapping.find(
    (m) =>
      m.displayValue === trimmed ||
      m.displayValue.toLowerCase() === trimmed.toLowerCase()
  )
  return found ? found.dbValue : null
}

/** DB value → display label (Excel) */
export function mapEnumToDisplay(
  dbValue: string,
  mapping: EnumMapping[]
): string {
  const found = mapping.find((m) => m.dbValue === dbValue)
  return found ? found.displayValue : dbValue
}
