import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import Imap from 'imap'
import { decryptPassword } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const email = await prisma.email.findFirst({
      where: { id, emailAccount: { userId: user.userId } },
      include: {
        emailAccount: {
          select: { id: true, email: true, provider: true }
        },
        pushLogs: {
          include: {
            channel: { select: { name: true, type: true } }
          }
        }
      }
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...email,
      toAddresses: JSON.parse(email.toAddresses || '[]'),
      attachments: email.attachments ? JSON.parse(email.attachments) : null,
      headers: email.headers ? JSON.parse(email.headers) : null,
    })
  } catch (error: any) {
    console.error('Error fetching email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    const { id } = await params

    const email = await prisma.email.findFirst({
      where: { id, emailAccount: { userId: user.userId } },
      include: { emailAccount: true }
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    switch (action) {
      case 'markAsRead':
        await markAsReadOnServer(email)
        await prisma.email.update({
          where: { id },
          data: { isRead: true }
        })
        break
      case 'markAsUnread':
        await prisma.email.update({
          where: { id },
          data: { isRead: false }
        })
        break
      case 'delete':
        await deleteOnServer(email)
        await prisma.email.delete({ where: { id } })
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error performing email action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}

async function markAsReadOnServer(email: any) {
  try {
    const password = decryptPassword(email.emailAccount.encryptedPassword)
    return new Promise<void>((resolve, reject) => {
      const imap = new Imap({
        user: email.emailAccount.email,
        password,
        host: email.emailAccount.imapHost,
        port: email.emailAccount.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000
      })

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) { imap.end(); resolve(); return }

          imap.search([['HEADER', 'MESSAGE-ID', email.messageId]], (searchErr, results) => {
            if (searchErr || !results?.length) { imap.end(); resolve(); return }

            imap.addFlags(results, ['\\Seen'], () => {
              imap.end()
              resolve()
            })
          })
        })
      })

      imap.once('error', () => resolve()) // Don't fail the API call if IMAP fails
      imap.connect()

      // Timeout after 15 seconds
      setTimeout(() => { try { imap.end() } catch { } resolve() }, 15000)
    })
  } catch {
    // IMAP sync is best-effort
  }
}

async function deleteOnServer(email: any) {
  try {
    const password = decryptPassword(email.emailAccount.encryptedPassword)
    return new Promise<void>((resolve, reject) => {
      const imap = new Imap({
        user: email.emailAccount.email,
        password,
        host: email.emailAccount.imapHost,
        port: email.emailAccount.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000
      })

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) { imap.end(); resolve(); return }

          imap.search([['HEADER', 'MESSAGE-ID', email.messageId]], (searchErr, results) => {
            if (searchErr || !results?.length) { imap.end(); resolve(); return }

            imap.addFlags(results, ['\\Deleted'], (flagErr) => {
              if (flagErr) { imap.end(); resolve(); return }
              imap.expunge(() => {
                imap.end()
                resolve()
              })
            })
          })
        })
      })

      imap.once('error', () => resolve())
      imap.connect()

      setTimeout(() => { try { imap.end() } catch { } resolve() }, 15000)
    })
  } catch {
    // IMAP sync is best-effort
  }
}
