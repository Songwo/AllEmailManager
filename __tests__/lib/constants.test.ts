import { describe, it, expect } from '@jest/globals'
import { emailProviders, pushChannelTypes, defaultTemplates } from '@/lib/constants'

describe('Constants', () => {
  describe('emailProviders', () => {
    it('should have valid email providers', () => {
      expect(emailProviders).toBeDefined()
      expect(emailProviders.length).toBeGreaterThan(0)
    })

    it('should have Gmail provider', () => {
      const gmail = emailProviders.find(p => p.value === 'gmail')
      expect(gmail).toBeDefined()
      expect(gmail?.imapHost).toBe('imap.gmail.com')
      expect(gmail?.imapPort).toBe(993)
    })

    it('should have Outlook provider', () => {
      const outlook = emailProviders.find(p => p.value === 'outlook')
      expect(outlook).toBeDefined()
      expect(outlook?.imapHost).toBe('outlook.office365.com')
    })

    it('should have QQ Mail provider', () => {
      const qq = emailProviders.find(p => p.value === 'qq')
      expect(qq).toBeDefined()
      expect(qq?.imapHost).toBe('imap.qq.com')
    })

    it('should have custom provider option', () => {
      const custom = emailProviders.find(p => p.value === 'custom')
      expect(custom).toBeDefined()
      expect(custom?.imapHost).toBe('')
    })
  })

  describe('pushChannelTypes', () => {
    it('should have valid push channel types', () => {
      expect(pushChannelTypes).toBeDefined()
      expect(pushChannelTypes.length).toBe(3)
    })

    it('should have WeChat channel', () => {
      const wechat = pushChannelTypes.find(c => c.type === 'wechat')
      expect(wechat).toBeDefined()
      expect(wechat?.name).toBe('企业微信')
      expect(wechat?.fields).toBeDefined()
    })

    it('should have Feishu channel', () => {
      const feishu = pushChannelTypes.find(c => c.type === 'feishu')
      expect(feishu).toBeDefined()
      expect(feishu?.name).toBe('飞书')
    })

    it('should have Telegram channel', () => {
      const telegram = pushChannelTypes.find(c => c.type === 'telegram')
      expect(telegram).toBeDefined()
      expect(telegram?.name).toBe('Telegram')
      expect(telegram?.fields.length).toBe(2) // botToken and chatId
    })
  })

  describe('defaultTemplates', () => {
    it('should have templates for all platforms', () => {
      expect(defaultTemplates.wechat).toBeDefined()
      expect(defaultTemplates.feishu).toBeDefined()
      expect(defaultTemplates.telegram).toBeDefined()
    })

    it('should have valid WeChat template', () => {
      expect(defaultTemplates.wechat).toContain('{from}')
      expect(defaultTemplates.wechat).toContain('{subject}')
      expect(defaultTemplates.wechat).toContain('{time}')
    })

    it('should have valid Feishu template', () => {
      expect(defaultTemplates.feishu).toHaveProperty('header')
      expect(defaultTemplates.feishu).toHaveProperty('elements')
    })

    it('should have valid Telegram template', () => {
      expect(defaultTemplates.telegram).toContain('<b>')
      expect(defaultTemplates.telegram).toContain('{from}')
    })
  })
})
