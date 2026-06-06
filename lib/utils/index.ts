import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Enhanced className utility combining clsx and Tailwind CSS merge functionality.
 *
 * This function provides intelligent class name handling for React components:
 * - **clsx**: Conditionally joins class names with support for objects, arrays, and boolean logic
 * - **twMerge**: Resolves Tailwind CSS class conflicts by keeping the last conflicting class
 *
 * Key benefits:
 * - Handles conditional styling with clean syntax
 * - Automatically resolves Tailwind class conflicts (e.g., `p-4 p-6` becomes just `p-6`)
 * - Filters out falsy values and empty strings
 * - Optimizes final className string for better performance
 *
 * @param inputs - Class values that can be strings, objects, arrays, or conditional expressions
 * @returns {string} Optimized className string with conflicts resolved
 *
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500') // "px-4 py-2 bg-blue-500"
 *
 * // Conditional classes
 * cn('base-class', {
 *   'text-red-500': hasError,
 *   'text-green-500': isSuccess
 * })
 *
 * // Conflict resolution
 * cn('p-4 text-sm', 'p-6') // "text-sm p-6" (p-4 is overridden)
 *
 * // Component prop merging
 * function Button({ className, variant, ...props }) {
 *   return (
 *     <button
 *       className={cn(
 *         'px-4 py-2 rounded',
 *         variant === 'primary' && 'bg-blue-500 text-white',
 *         variant === 'secondary' && 'bg-gray-200 text-gray-800',
 *         className // User classes override defaults
 *       )}
 *       {...props}
 *     />
 *   )
 * }
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(name: string): string {
  let slug = name.toLowerCase().trim()
  // replace Turkish characters
  const charMap: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'C',
    Ğ: 'G',
    İ: 'I',
    Ö: 'O',
    Ş: 'S',
    Ü: 'U',
  }
  slug = slug.replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => charMap[char] || char)
  // Replace spaces and non-word characters with hyphens
  slug = slug.replace(/[\s\W-]+/g, '-')
  // Remove leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '')
  // replace multiple hyphens with a single hyphen
  slug = slug.replace(/-+/g, '-')

  return slug
}

export function isValidTCKN(tckn: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tckn)) {
    return false
  }

  const digits = tckn.split('').map(Number)

  const sumOdd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const sumEven = digits[1] + digits[3] + digits[5] + digits[7]

  const digit10 = (sumOdd * 7 - sumEven) % 10
  const digit11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10

  return digit10 === digits[9] && digit11 === digits[10]
}

type NullToUndefined<T> = T extends null
  ? undefined
  : T extends object
    ? { [K in keyof T]: NullToUndefined<T[K]> }
    : T

export function convertNullsToUndefined<T extends Record<string, unknown>>(
  obj: T
): NullToUndefined<T> {
  const result = {} as NullToUndefined<T>

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (value === null) {
        ;(result as Record<string, unknown>)[key] = undefined
      } else if (typeof value === 'object' && value !== undefined) {
        ;(result as Record<string, unknown>)[key] = convertNullsToUndefined(
          value as Record<string, unknown>
        )
      } else {
        ;(result as Record<string, unknown>)[key] = value
      }
    }
  }

  return result
}

/**
 * Normalizes search text for case-insensitive and Turkish-English character insensitive search.
 *
 * This function:
 * - Converts text to lowercase
 * - Removes all whitespace characters
 * - Replaces Turkish characters with their English equivalents
 * - Handles both Turkish and English input seamlessly
 *
 * Turkish character mappings:
 * - İ, ı → i
 * - Ş, ş → s
 * - Ğ, ğ → g
 * - Ü, ü → u
 * - Ö, ö → o
 * - Ç, ç → c
 *
 * @param text - The text to normalize
 * @returns Normalized text ready for search comparison
 *
 * @example
 * ```typescript
 * normalizeSearchText("İstanbul") // "istanbul"
 * normalizeSearchText("Istanbul") // "istanbul"
 * normalizeSearchText("Ali Veli") // "aliveli"
 * normalizeSearchText("Şanlıurfa") // "sanliurfa"
 * ```
 */
export function normalizeSearchText(text: string): string {
  if (!text) return ''

  const charMap: Record<string, string> = {
    // Turkish to English mappings
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    İ: 'i',
    I: 'i', // Turkish dotless I
    Ö: 'o',
    Ş: 's',
    Ü: 'u',
  }

  return text
    .toLowerCase()
    .replace(/\s+/g, '') // Remove all whitespace characters
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => charMap[char] || char)
}

/**
 * Converts Turkish characters to English equivalents for email generation
 */
function turkishToEnglish(text: string): string {
  const charMap: Record<string, string> = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    İ: 'i',
    I: 'i',
    Ö: 'o',
    Ş: 's',
    Ü: 'u',
  }
  return text.replace(/[çğıöşüÇĞİIÖŞÜ]/g, (char) => charMap[char] || char)
}

/**
 * Generates a unique email address in the format: firstName.lastName@aksiyonsoft.com
 * If the email already exists, appends a number (1, 2, 3, etc.)
 *
 * @param firstName - First name of the user
 * @param lastName - Last name of the user
 * @param checkUnique - Function to check if email is unique (returns true if unique)
 * @returns Unique email address
 */
export async function generateUniqueEmail(
  firstName: string,
  lastName: string,
  checkUnique: (email: string) => Promise<boolean>
): Promise<string> {
  // Convert to English characters and normalize
  const normalizedFirstName = turkishToEnglish(firstName.trim().toLowerCase())
  const normalizedLastName = turkishToEnglish(lastName.trim().toLowerCase())

  // Remove special characters except dots and hyphens, replace spaces with dots
  const cleanFirstName = normalizedFirstName
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\s+/g, '.')
  const cleanLastName = normalizedLastName
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\s+/g, '.')

  // Base email: firstName.lastName@aksiyonsoft.com
  const baseEmail = `${cleanFirstName}.${cleanLastName}@aksiyonsoft.com`

  // Check if base email is unique
  const isBaseUnique = await checkUnique(baseEmail)
  if (isBaseUnique) {
    return baseEmail
  }

  // If not unique, try with numbers: ad.soyad1@, ad.soyad2@, etc.
  let counter = 1
  let email = `${cleanFirstName}.${cleanLastName}${counter}@aksiyonsoft.com`

  while (!(await checkUnique(email))) {
    counter++
    email = `${cleanFirstName}.${cleanLastName}${counter}@aksiyonsoft.com`

    // Safety check to prevent infinite loop
    if (counter > 1000) {
      throw new Error('Could not generate unique email after 1000 attempts')
    }
  }

  return email
}

/**
 * Capitalizes the first letter of each word and makes the rest lowercase.
 * Handles Turkish characters correctly.
 *
 * @param text - The text to capitalize
 * @returns Text with each word's first letter capitalized and rest lowercase
 *
 * @example
 * ```typescript
 
 * ```
 */
export function capitalizeWords(text: string | null | undefined): string {
  if (!text) return ''

  const locale = 'tr-TR'

  return text
    .trim()
    .split(/\s+/g)
    .map((word) => {
      // Support hyphenated words: "ADMIN-DIRECTOR" -> "Admin-Director"
      return word
        .split('-')
        .map((part) => {
          if (!part) return part
          return (
            part.charAt(0).toLocaleUpperCase(locale) +
            part.slice(1).toLocaleLowerCase(locale)
          )
        })
        .join('-')
    })
    .join(' ')
}

/**
 * Translates auth.changePassword error messages from English to Turkish.
 * Backend returns English error messages, but we want to show Turkish messages to users.
 *
 * @param errorMessage - The error message from the backend
 * @returns Turkish translation of the error message, or the original message if already Turkish
 *
 * @example
 * ```typescript
 * translateChangePasswordError("Password too short") // "Şifre çok kısa"
 * translateChangePasswordError("Invalid password") // "Mevcut şifre hatalı"
 * translateChangePasswordError("Mevcut şifre hatalı") // "Mevcut şifre hatalı" (already Turkish)
 * ```
 */
export function translateChangePasswordError(errorMessage: string): string {
  if (!errorMessage) return 'Şifre değiştirilirken bir hata oluştu'

  const message = errorMessage.trim()

  // English to Turkish translations
  const translations: Record<string, string> = {
    'Password too short': 'Şifre çok kısa',
    'password too short': 'Şifre çok kısa',
    'Invalid password': 'Mevcut şifre hatalı',
    'invalid password': 'Mevcut şifre hatalı',
    'Password must be at least 6 characters':
      'Şifre en az 6 karakter olmalıdır',
    'password must be at least 6 characters':
      'Şifre en az 6 karakter olmalıdır',
  }

  // Check for exact match first
  if (translations[message]) {
    return translations[message]
  }

  // Check for case-insensitive match
  const lowerMessage = message.toLowerCase()
  for (const [key, value] of Object.entries(translations)) {
    if (key.toLowerCase() === lowerMessage) {
      return value
    }
  }

  // Check if message contains any of the English phrases
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // If already Turkish or unknown, return as is
  return message
}
