import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { decryptPassword } from '@/lib/encryption'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, data } = await request.json()
    const emailId = params.id

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        emailAccount: true
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    switch (action) {
      case 'markAsRead':
        await markAsRead(email)
        break
      case 'delete':
        await deleteEmail(email)
        break
      case 'reply':
        await replyToEmail(email, data.content)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
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

async function markAsRead(email: any) {
  const password = decryptPassword(email.emailAccount.encryptedPassword)

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email.emailAccount.email,
      password: password,
      host: email.emailAccount.imapHost,
      port: email.emailAccount.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    })

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          reject(err)
          return
        }

        imap.search([['HEADER', 'MESSAGE-ID', email.messageId]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end()
            reject(err || new Error('Email not found'))
            return
          }

          imap.addFlags(results, ['\\Seen'], (err) => {
            imap.end()
            if (err) {
              reject(err)
            } else {
              prisma.email.update({
                where: { id: email.id },
                data: { isRead: true }
              }).then(resolve).catch(reject)
            }
          })
        })
      })
    })

    imap.once('error', reject)
    imap.connect()
  })
}

async function deleteEmail(email: any) {
  const password = decryptPassword(email.emailAccount.encryptedPassword)

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: email.emailAccount.email,
      password: password,
      host: email.emailAccount.imapHost,
      port: email.emailAccount.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    })

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          reject(err)
          return
        }

        imap.search([['HEADER', 'MESSAGE-ID', email.messageId]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end()
            reject(err || new Error('Email not found'))
            return
          }

          imap.addFlags(results, ['\\Deleted'], (err) => {
            if (err) {
              imap.end()
              reject(err)
              return
            }

            imap.expunge((err) => {
              imap.end()
              if (err) {
                reject(err)
              } else {
                prisma.email.delete({
                  where: { id: email.id }
                }).then(resolve).catch(reject)
              }
            })
          })
        })
      })
    })

    imap.once('error', reject)
    imap.connect()
  })
}

async function replyToEmail(email: any, content: string) {
  // This would require SMTP implementation
  // For now, we'll just log it
  console.log('Reply to:', email.from, 'Content:', content)

  // TODO: Implement SMTP sending
  // const nodemailer = require('nodemailer')
  // const transporter = nodemailer.createTransport({...})
  // await transporter.sendMail({...})

  return Promise.resolve()
}
