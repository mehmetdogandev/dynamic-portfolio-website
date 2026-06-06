import { createHash } from 'crypto'

const OTP_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const OTP_LENGTH = 8

/**
 * Produces a deterministic 8-character OTP code from an identifier (e.g. verification identifier).
 * Character set: A-Z and 0-9 (36 chars). Same identifier always yields the same code.
 */
export function identifierToOtpCode(identifier: string): string {
  const hash = createHash('sha256').update(identifier, 'utf8').digest()
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    const byteIndex = i % hash.length
    code += OTP_CHARSET[hash[byteIndex]! % OTP_CHARSET.length]
  }
  return code
}
