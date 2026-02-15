import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  signToken,
  getUserFromRequest,
  signChallengeToken,
  verifyChallengeToken
} from '@/lib/auth'
import { decryptPassword, encryptPassword } from '@/lib/encryption'
import { verifyTotpCode } from '@/lib/two-factor'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const verifyTwoFactorSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().min(4)
})

function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'register') {
      const body = await request.json()
      const data = registerSchema.parse(body)

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email }
      })
      if (existing) {
        return NextResponse.json(
          { error: '该邮箱已被注册' },
          { status: 400 }
        )
      }

      const hashedPassword = await bcrypt.hash(data.password, 10)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: hashedPassword
        }
      })

      // Create default settings
      await prisma.userSettings.create({
        data: { userId: user.id }
      })

      const token = signToken({ userId: user.id, email: user.email })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        token,
        createdAt: user.createdAt
      })

    } else if (action === 'login') {
      const body = await request.json()
      const data = loginSchema.parse(body)

      const user = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (!user || !user.password || !await bcrypt.compare(data.password, user.password)) {
        return NextResponse.json(
          { error: '邮箱或密码错误' },
          { status: 401 }
        )
      }

      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const challengeToken = signChallengeToken({
          userId: user.id,
          email: user.email,
          purpose: '2fa'
        })

        return NextResponse.json({
          requiresTwoFactor: true,
          challengeToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl
          }
        })
      }

      const token = signToken({ userId: user.id, email: user.email })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        token,
        createdAt: user.createdAt
      })

    } else if (action === 'verify-2fa') {
      const body = await request.json()
      const data = verifyTwoFactorSchema.parse(body)

      const challenge = verifyChallengeToken(data.challengeToken)
      if (!challenge) {
        return NextResponse.json({ error: '2FA challenge 已过期，请重新登录' }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { id: challenge.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          recoveryCodes: true
        }
      })

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json({ error: '2FA 未启用，请重新登录' }, { status: 400 })
      }

      const decryptedSecret = decryptPassword(user.twoFactorSecret)
      let verified = verifyTotpCode(decryptedSecret, data.code)
      let usedRecoveryCode = false

      if (!verified && user.recoveryCodes) {
        const codes = JSON.parse(decryptPassword(user.recoveryCodes)) as string[]
        const normalizedInput = normalizeRecoveryCode(data.code)
        const matched = codes.find((code) => normalizeRecoveryCode(code) === normalizedInput)
        if (matched) {
          const remained = codes.filter((code) => normalizeRecoveryCode(code) !== normalizedInput)
          await prisma.user.update({
            where: { id: user.id },
            data: {
              recoveryCodes: encryptPassword(JSON.stringify(remained))
            }
          })
          verified = true
          usedRecoveryCode = true
        }
      }

      if (!verified) {
        return NextResponse.json({ error: '验证码错误' }, { status: 401 })
      }

      const token = signToken({ userId: user.id, email: user.email })
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        token,
        createdAt: user.createdAt,
        usedRecoveryCode
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=register, ?action=login or ?action=verify-2fa' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}

// GET /api/auth — verify token and return current user
export async function GET(request: Request) {
  try {
    const payload = getUserFromRequest(request)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        twoFactorEnabled: true,
        createdAt: true,
        _count: {
          select: {
            emailAccounts: true,
            pushChannels: true,
            filterRules: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('Auth verify error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify token' },
      { status: 500 }
    )
  }
}
