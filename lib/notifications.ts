import { prisma } from './prisma'
import type { CreateNotificationInput, NotificationType } from './types'

export type { NotificationType }

export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'info',
        metadata: input.metadata ? JSON.stringify(input.metadata) : null
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
