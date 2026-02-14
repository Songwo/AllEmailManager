import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken, getUserFromRequest } from '@/lib/auth'

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

      const token = signToken({ userId: user.id, email: user.email })

      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        token,
        createdAt: user.createdAt
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use ?action=register or ?action=login' },
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
