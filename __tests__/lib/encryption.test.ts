import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { encryptPassword, decryptPassword } from '@/lib/encryption'

describe('Encryption Utils', () => {
  const testPassword = 'test-password-123'

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
  })

  it('should encrypt password', () => {
    const encrypted = encryptPassword(testPassword)
    expect(encrypted).toBeDefined()
    expect(encrypted).not.toBe(testPassword)
    expect(encrypted.length).toBeGreaterThan(0)
  })

  it('should decrypt password correctly', () => {
    const encrypted = encryptPassword(testPassword)
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(testPassword)
  })

  it('should produce different encrypted values for same input', () => {
    const encrypted1 = encryptPassword(testPassword)
    const encrypted2 = encryptPassword(testPassword)
    // AES encryption with random IV should produce different results
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should handle empty string', () => {
    const encrypted = encryptPassword('')
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe('')
  })

  it('should handle special characters', () => {
    const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const encrypted = encryptPassword(specialPassword)
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(specialPassword)
  })

  it('should handle unicode characters', () => {
    const unicodePassword = '密码测试🔐'
    const encrypted = encryptPassword(unicodePassword)
    const decrypted = decryptPassword(encrypted)
    expect(decrypted).toBe(unicodePassword)
  })
})
