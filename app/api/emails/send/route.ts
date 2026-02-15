import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { sendEmail } from '@/lib/email-service'
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

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    const body = sendEmailSchema.parse(requestBody)

    const result = await sendEmail(user.userId, body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
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
