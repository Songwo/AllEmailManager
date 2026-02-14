import crypto from 'node:crypto'

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const DEFAULT_STEP_SECONDS = 30
const DEFAULT_DIGITS = 6

function randomBase32(length: number): string {
  const bytes = crypto.randomBytes(length)
  let output = ''
  for (let i = 0; i < bytes.length; i++) {
    output += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length]
  }
  return output
}

function normalizeBase32(input: string): string {
  return input.toUpperCase().replace(/[^A-Z2-7]/g, '')
}

function decodeBase32(input: string): Buffer {
  const normalized = normalizeBase32(input)
  let bits = ''

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index < 0) continue
    bits += index.toString(2).padStart(5, '0')
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function hotp(secret: string, counter: number, digits = DEFAULT_DIGITS): string {
  const key = decodeBase32(secret)
  const counterBuffer = Buffer.alloc(8)
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0)

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const value = (code % 10 ** digits).toString().padStart(digits, '0')
  return value
}

export function generateTwoFactorSecret(): string {
  return randomBase32(32)
}

export function generateOtpauthUrl(
  secret: string,
  accountName: string,
  issuer = 'EmailHub'
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedAccount = encodeURIComponent(accountName)
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${DEFAULT_DIGITS}&period=${DEFAULT_STEP_SECONDS}`
}

export function verifyTotpCode(
  secret: string,
  token: string,
  window = 1
): boolean {
  const normalizedToken = token.replace(/\s+/g, '').trim()
  if (!/^\d{6}$/.test(normalizedToken)) return false

  const currentCounter = Math.floor(Date.now() / 1000 / DEFAULT_STEP_SECONDS)
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    if (hotp(secret, currentCounter + errorWindow) === normalizedToken) {
      return true
    }
  }
  return false
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const partA = crypto.randomBytes(2).toString('hex').toUpperCase()
    const partB = crypto.randomBytes(2).toString('hex').toUpperCase()
    codes.push(`${partA}-${partB}`)
  }
  return codes
}
