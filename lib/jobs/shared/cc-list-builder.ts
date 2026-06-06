/**
 * Shared CC List Builder Utility
 *
 * Domain-specific hierarchy logic has been removed. This helper now builds
 * CC recipients from static/system configuration only.
 */

const DEFAULT_CC_EMAILS = ['no-reply@aksiyonsoft.com']

const parseCsvEmails = (value: string | undefined): string[] => {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export async function buildCCListForUser(_userId: string): Promise<string[]> {
  const configured = parseCsvEmails(process.env.SYSTEM_DEFAULT_CC_EMAILS)
  return Array.from(new Set([...DEFAULT_CC_EMAILS, ...configured]))
}
