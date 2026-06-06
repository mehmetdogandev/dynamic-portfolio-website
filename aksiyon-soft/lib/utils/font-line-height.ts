/**
 * Utility functions for calculating recommended line height based on font family
 */

/**
 * Get recommended line height for a given font family
 * @param fontFamily - Font family string (e.g., "Arial, sans-serif")
 * @returns Recommended line height value (as a number, e.g., 1.4)
 */
export function getRecommendedLineHeight(fontFamily: string): number {
  const normalized = fontFamily.toLowerCase()

  // Serif fonts - typically need more line height for readability
  if (
    normalized.includes('times') ||
    normalized.includes('georgia') ||
    normalized.includes('serif') ||
    normalized.includes('garamond') ||
    normalized.includes('baskerville')
  ) {
    return 1.5
  }

  // Monospace fonts - typically need less line height
  if (
    normalized.includes('courier') ||
    normalized.includes('monospace') ||
    normalized.includes('consolas') ||
    normalized.includes('monaco')
  ) {
    return 1.3
  }

  // Sans-serif fonts (default) - balanced line height
  // This includes Arial, Helvetica, Verdana, etc.
  if (
    normalized.includes('arial') ||
    normalized.includes('helvetica') ||
    normalized.includes('sans-serif') ||
    normalized.includes('verdana') ||
    normalized.includes('tahoma')
  ) {
    return 1.4
  }

  // Default for unknown fonts
  return 1.4
}

/**
 * Format line height value for CSS
 * @param value - Line height value (number or string)
 * @returns Formatted line height string
 */
export function formatLineHeight(value: number | string): string {
  if (typeof value === 'string') {
    // If it's already a string with units, return as is
    if (value.match(/^\d+(\.\d+)?(px|em|rem|%)?$/)) {
      return value
    }
    // Try to parse as number
    const num = parseFloat(value)
    if (!isNaN(num)) {
      return String(num)
    }
    return value
  }
  return String(value)
}
