import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptPassword } from '@/lib/encryption'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'
import Imap from 'imap'

export const dynamic = 'force-dynamic'

const emailAccountSchema = z.object({
  email: z.string().email(),
  provider: z.string(),
  imapHost: z.string(),
  imapPort: z.number(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  password: z.string()
})

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = emailAccountSchema.parse(body)

    // Test IMAP connection
    const testResult = await testImapConnection(
      data.email, data.password, data.imapHost, data.imapPort
    )
    if (!testResult.success) {
      return NextResponse.json(
        { error: `IMAP 连接失败: ${testResult.error}` },
        { status: 400 }
      )
    }

    const encryptedPassword = encryptPassword(data.password)

    const account = await prisma.emailAccount.create({
      data: {
        userId: user.userId,
        email: data.email,
        provider: data.provider,
        imapHost: data.imapHost,
        imapPort: data.imapPort,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        encryptedPassword,
        isActive: true,
        status: 'connected'
      }
    })

    return NextResponse.json(account)
  } catch (error: any) {
    console.error('Error creating email account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create email account' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.emailAccount.findMany({
      where: { userId: user.userId },
      select: {
        id: true,
        email: true,
        provider: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        lastSyncAt: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { emails: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('Error fetching email accounts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email accounts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, password, ...updateData } = body

    // Verify ownership
    const existing = await prisma.emailAccount.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const data: any = { ...updateData }
    if (password) {
      data.encryptedPassword = encryptPassword(password)
    }

    const account = await prisma.emailAccount.update({
      where: { id },
      data
    })

    return NextResponse.json(account)
  } catch (error: any) {
    console.error('Error updating email account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.emailAccount.findFirst({
      where: { id, userId: user.userId }
    })
    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Cascade delete: emails and push logs will be auto-deleted via schema
    await prisma.emailAccount.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting email account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email account' },
      { status: 500 }
    )
  }
}

function testImapConnection(
  email: string, password: string, host: string, port: number
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: host,
      port: port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000
    })

    imap.once('ready', () => {
      imap.end()
      resolve({ success: true })
    })

    imap.once('error', (err: Error) => {
      resolve({ success: false, error: err.message })
    })

    imap.connect()
  })
}
