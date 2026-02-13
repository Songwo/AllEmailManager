import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encryptPassword } from '@/lib/encryption'
import { z } from 'zod'
import Imap from 'imap'

const emailAccountSchema = z.object({
  email: z.string().email(),
  provider: z.string(),
  imapHost: z.string(),
  imapPort: z.number(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().optional(),
  password: z.string(),
  userId: z.string()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = emailAccountSchema.parse(body)

    // Test IMAP connection
    const testConnection = await testImapConnection(
      data.email,
      data.password,
      data.imapHost,
      data.imapPort
    )

    if (!testConnection.success) {
      return NextResponse.json(
        { error: testConnection.error },
        { status: 400 }
      )
    }

    // Encrypt password
    const encryptedPassword = encryptPassword(data.password)

    // Create email account
    const account = await prisma.emailAccount.create({
      data: {
        userId: data.userId,
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const accounts = await prisma.emailAccount.findMany({
      where: { userId },
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

function testImapConnection(
  email: string,
  password: string,
  host: string,
  port: number
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
