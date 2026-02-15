import { prisma } from './prisma'

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type?: NotificationType
  metadata?: Record<string, unknown> | null
}

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
