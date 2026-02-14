import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { decryptPassword, encryptPassword } from '@/lib/encryption'
import {
  generateOtpauthUrl,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  verifyTotpCode
} from '@/lib/two-factor'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('setup') }),
  z.object({ action: z.literal('verify'), code: z.string().min(4) }),
  z.object({ action: z.literal('enable'), code: z.string().min(4) }),
  z.object({
    action: z.literal('disable'),
    code: z.string().min(4),
    password: z.string().min(1)
  }),
  z.object({ action: z.literal('regenerateRecoveryCodes'), code: z.string().min(4) })
])

function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

function verifyWithRecoveryCodes(
  encryptedCodes: string | null,
  code: string
): { success: boolean; remainingCodes: string[] } {
  if (!encryptedCodes) return { success: false, remainingCodes: [] }
  const decrypted = decryptPassword(encryptedCodes)
  const codes = JSON.parse(decrypted) as string[]
  const normalizedInput = normalizeRecoveryCode(code)
  const matched = codes.find((item) => normalizeRecoveryCode(item) === normalizedInput)
  if (!matched) return { success: false, remainingCodes: codes }
  return {
    success: true,
    remainingCodes: codes.filter((item) => normalizeRecoveryCode(item) !== normalizedInput)
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorTempSecret: true,
        recoveryCodes: true,
        twoFactorVerifiedAt: true
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let recoveryCodesLeft = 0
    if (dbUser.recoveryCodes) {
      try {
        const codes = JSON.parse(decryptPassword(dbUser.recoveryCodes)) as string[]
        recoveryCodesLeft = codes.length
      } catch {
        recoveryCodesLeft = 0
      }
    }

    return NextResponse.json({
      enabled: dbUser.twoFactorEnabled,
      hasPendingSetup: !!dbUser.twoFactorTempSecret,
      recoveryCodesLeft,
      verifiedAt: dbUser.twoFactorVerifiedAt
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch 2FA status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.json()
    const body = actionSchema.parse(rawBody)

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorTempSecret: true,
        recoveryCodes: true,
        password: true
      }
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (body.action === 'setup') {
      const secret = generateTwoFactorSecret()
      const recoveryCodes = generateRecoveryCodes()
      const otpauthUrl = generateOtpauthUrl(secret, dbUser.email, 'EmailHub')
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          twoFactorTempSecret: encryptPassword(secret),
          recoveryCodes: encryptPassword(JSON.stringify(recoveryCodes))
        }
      })

      return NextResponse.json({
        secret,
        otpauthUrl,
        qrCodeDataUrl,
        recoveryCodes
      })
    }

    if (body.action === 'verify') {
      const encryptedSecret = dbUser.twoFactorTempSecret || dbUser.twoFactorSecret
      if (!encryptedSecret) {
        return NextResponse.json({ error: '请先生成 2FA 密钥' }, { status: 400 })
      }
      const secret = decryptPassword(encryptedSecret)
      const validTotp = verifyTotpCode(secret, body.code)
      if (validTotp) {
        return NextResponse.json({ valid: true, usedRecoveryCode: false })
      }

      const recoveryResult = verifyWithRecoveryCodes(dbUser.recoveryCodes, body.code)
      return NextResponse.json({
        valid: recoveryResult.success,
        usedRecoveryCode: recoveryResult.success
      })
    }

    if (body.action === 'enable') {
      if (!dbUser.twoFactorTempSecret) {
        return NextResponse.json({ error: '请先完成 2FA 初始化' }, { status: 400 })
      }
      const tempSecret = decryptPassword(dbUser.twoFactorTempSecret)
      if (!verifyTotpCode(tempSecret, body.code)) {
        return NextResponse.json({ error: '验证码错误' }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            twoFactorEnabled: true,
            twoFactorSecret: dbUser.twoFactorTempSecret,
            twoFactorTempSecret: null,
            twoFactorVerifiedAt: new Date()
          }
        }),
        prisma.userSettings.upsert({
          where: { userId: dbUser.id },
          create: {
            userId: dbUser.id,
            twoFactorEnabled: true
          },
          update: {
            twoFactorEnabled: true
          }
        })
      ])

      await createNotification({
        userId: dbUser.id,
        title: '安全提醒',
        message: 'Google 二次验证已启用',
        type: 'success'
      })

      return NextResponse.json({ success: true })
    }

    if (body.action === 'disable') {
      if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
        return NextResponse.json({ error: '2FA 尚未启用' }, { status: 400 })
      }
      if (!dbUser.password || !await bcrypt.compare(body.password, dbUser.password)) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 400 })
      }

      const secret = decryptPassword(dbUser.twoFactorSecret)
      const validTotp = verifyTotpCode(secret, body.code)
      const recoveryResult = verifyWithRecoveryCodes(dbUser.recoveryCodes, body.code)
      if (!validTotp && !recoveryResult.success) {
        return NextResponse.json({ error: '验证码或恢复码错误' }, { status: 400 })
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: dbUser.id },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorTempSecret: null,
            recoveryCodes: null,
            twoFactorVerifiedAt: null
          }
        }),
        prisma.userSettings.upsert({
          where: { userId: dbUser.id },
          create: {
            userId: dbUser.id,
            twoFactorEnabled: false
          },
          update: {
            twoFactorEnabled: false
          }
        })
      ])

      await createNotification({
        userId: dbUser.id,
        title: '安全提醒',
        message: 'Google 二次验证已关闭',
        type: 'warning'
      })

      return NextResponse.json({ success: true })
    }

    if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
      return NextResponse.json({ error: '2FA 尚未启用' }, { status: 400 })
    }

    const activeSecret = decryptPassword(dbUser.twoFactorSecret)
    const validCode = verifyTotpCode(activeSecret, body.code)
    const recoveryResult = verifyWithRecoveryCodes(dbUser.recoveryCodes, body.code)
    if (!validCode && !recoveryResult.success) {
      return NextResponse.json({ error: '验证码或恢复码错误' }, { status: 400 })
    }

    const recoveryCodes = generateRecoveryCodes()
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        recoveryCodes: encryptPassword(JSON.stringify(recoveryCodes))
      }
    })

    await createNotification({
      userId: dbUser.id,
      title: '安全提醒',
      message: '恢复码已重新生成，请妥善保存',
      type: 'info'
    })

    return NextResponse.json({ success: true, recoveryCodes })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid 2FA payload' }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : '2FA action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
