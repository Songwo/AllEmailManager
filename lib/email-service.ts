// ============================================================================
// Email sending service – extracted from app/api/emails/send/route.ts
// ============================================================================

import nodemailer from 'nodemailer'
import { prisma } from './prisma'
import { decryptPassword } from './encryption'
import { createLogger } from './logger'
import type { SendEmailInput } from './types'

const log = createLogger('email-service')

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

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(userId: string, input: SendEmailInput): Promise<SendEmailResult> {
  const { emailAccountId, to, cc, bcc, subject, body, html, inReplyTo, references } = input

  const toList = normalizeAddresses(to)
  const ccList = normalizeAddresses(cc)
  const bccList = normalizeAddresses(bcc)

  if (toList.length === 0) {
    return { success: false, error: 'At least one recipient is required' }
  }

  const account = await prisma.emailAccount.findFirst({
    where: { id: emailAccountId, userId }
  })

  if (!account) {
    return { success: false, error: 'Email account not found' }
  }

  if (!account.smtpHost || !account.smtpPort) {
    return { success: false, error: 'SMTP not configured for this account' }
  }

  const password = decryptPassword(account.encryptedPassword)

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.email,
      pass: password
    }
  })

  const mailOptions: Record<string, unknown> = {
    from: account.email,
    to: toList.join(', '),
    subject,
    text: body,
    html: html || body.replace(/\n/g, '<br>')
  }

  if (ccList.length > 0) mailOptions.cc = ccList.join(', ')
  if (bccList.length > 0) mailOptions.bcc = bccList.join(', ')
  if (inReplyTo) mailOptions.inReplyTo = inReplyTo
  if (references) {
    mailOptions.references = Array.isArray(references)
      ? references.filter(Boolean)
      : references
  }

  try {
    const info = await transporter.sendMail(mailOptions as nodemailer.SendMailOptions)
    log.info('Email sent', { messageId: info.messageId, to: toList })
    return { success: true, messageId: info.messageId }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    log.error('Failed to send email', { error: message })
    return { success: false, error: message }
  }
}
