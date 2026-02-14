import crypto from 'crypto'
import { env } from './env'

const JWT_SECRET = env.NEXTAUTH_SECRET

interface TokenPayload {
    userId: string
    email: string
}

/**
 * Sign a JWT token using HMAC-SHA256
 */
export function signToken(payload: TokenPayload): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
    })).toString('base64url')

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url')

    return `${header}.${body}.${signature}`
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) return null

        const [header, body, signature] = parts

        // Verify signature
        const expectedSig = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url')

        if (signature !== expectedSig) return null

        // Decode payload
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString())

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

        return { userId: payload.userId, email: payload.email }
    } catch {
        return null
    }
}

/**
 * Extract user info from the Authorization header of a request
 */
export function getUserFromRequest(request: Request): TokenPayload | null {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    const token = authHeader.substring(7)
    return verifyToken(token)
}
