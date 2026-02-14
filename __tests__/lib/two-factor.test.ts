import { describe, expect, it } from '@jest/globals'
import {
  generateOtpauthUrl,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  verifyTotpCode
} from '@/lib/two-factor'

describe('two-factor utils', () => {
  it('should generate a valid base32 secret', () => {
    const secret = generateTwoFactorSecret()
    expect(secret).toMatch(/^[A-Z2-7]+$/)
    expect(secret.length).toBeGreaterThanOrEqual(16)
  })

  it('should generate otpauth url', () => {
    const secret = generateTwoFactorSecret()
    const url = generateOtpauthUrl(secret, 'test@example.com', 'EmailHub')
    expect(url.startsWith('otpauth://totp/')).toBe(true)
    expect(url.includes('secret=')).toBe(true)
    expect(url.includes('issuer=EmailHub')).toBe(true)
  })

  it('should reject invalid totp code format', () => {
    const secret = generateTwoFactorSecret()
    expect(verifyTotpCode(secret, 'abcd')).toBe(false)
    expect(verifyTotpCode(secret, '12345')).toBe(false)
  })

  it('should generate recovery codes', () => {
    const codes = generateRecoveryCodes(8)
    expect(codes).toHaveLength(8)
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/)
    }
  })
})
