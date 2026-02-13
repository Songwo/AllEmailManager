import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Prisma Client', () => {
  beforeAll(async () => {
    // Setup test database
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`
    expect(result).toBeDefined()
  })

  it('should create user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password'
      }
    })

    expect(user).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } })
  })

  it('should enforce unique email constraint', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'unique@example.com',
        name: 'User 1',
        password: 'password'
      }
    })

    await expect(
      prisma.user.create({
        data: {
          email: 'unique@example.com',
          name: 'User 2',
          password: 'password'
        }
      })
    ).rejects.toThrow()

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } })
  })
})
