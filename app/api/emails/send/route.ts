import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptPassword } from '@/lib/encryption'
import nodemailer from 'nodemailer'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const sendEmailSchema = z.object({
  emailAccountId: z.string().min(1),
  to: z.union([z.string(), z.array(z.string())]),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  html: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.union([z.string(), z.array(z.string())]).optional()
})

function normalizeAddresses(input?: string | string[]): string[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.map((v) => v.trim()).filter(Boolean)
  }
  return input
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    const body = sendEmailSchema.parse(requestBody)
    const {
      emailAccountId,
      to,
      cc,
      bcc,
      subject,
      body: emailBody,
      inReplyTo,
      references
    } = body

    const toList = normalizeAddresses(to)
    const ccList = normalizeAddresses(cc)
    const bccList = normalizeAddresses(bcc)

    if (toList.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    // Get email account
    const account = await prisma.emailAccount.findFirst({
      where: { id: emailAccountId, userId: user.userId }
    })

    if (!account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    if (!account.smtpHost || !account.smtpPort) {
      return NextResponse.json(
        { error: 'SMTP not configured for this account' },
        { status: 400 }
      )
    }

    // Decrypt password
    const password = decryptPassword(account.encryptedPassword)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpPort === 465,
      auth: {
        user: account.email,
        pass: password
      }
    })

    // Prepare email options
    const mailOptions: any = {
      from: account.email,
      to: toList.join(', '),
      subject,
      text: emailBody,
      html: body.html || emailBody.replace(/\n/g, '<br>')
    }

    if (ccList.length > 0) mailOptions.cc = ccList.join(', ')
    if (bccList.length > 0) mailOptions.bcc = bccList.join(', ')
    if (inReplyTo) mailOptions.inReplyTo = inReplyTo
    if (references) {
      mailOptions.references = Array.isArray(references)
        ? references.filter(Boolean)
        : references
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent: ${info.messageId}`)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
