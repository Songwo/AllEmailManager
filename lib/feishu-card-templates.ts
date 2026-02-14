export interface FeishuPreset {
  id: string
  name: string
  description: string
  category: 'business' | 'alert' | 'minimal'
  card: Record<string, unknown>
}

export const feishuCardPresets: FeishuPreset[] = [
  {
    id: 'business-summary',
    name: '商务摘要',
    description: '适合日常业务邮件，信息完整，强调发件人与主题。',
    category: 'business',
    card: {
      header: {
        title: { tag: 'plain_text', content: '📧 业务邮件通知' },
        template: 'blue'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: '**发件人：** {from}' } },
        { tag: 'div', text: { tag: 'lark_md', content: '**主题：** {subject}' } },
        { tag: 'div', text: { tag: 'lark_md', content: '**时间：** {time}' } },
        { tag: 'hr' },
        { tag: 'div', text: { tag: 'plain_text', content: '摘要：\n{preview}' } }
      ]
    }
  },
  {
    id: 'urgent-alert',
    name: '紧急告警',
    description: '适合告警类邮件，突出高优先级信息。',
    category: 'alert',
    card: {
      header: {
        title: { tag: 'plain_text', content: '🚨 紧急邮件告警' },
        template: 'red'
      },
      elements: [
        { tag: 'div', text: { tag: 'lark_md', content: '**发件人：** {from}' } },
        { tag: 'div', text: { tag: 'lark_md', content: '**主题：** {subject}' } },
        { tag: 'div', text: { tag: 'plain_text', content: '{preview}' } },
        {
          tag: 'note',
          elements: [
            { tag: 'plain_text', content: '请尽快处理，避免业务影响。' }
          ]
        }
      ]
    }
  },
  {
    id: 'minimal-compact',
    name: '极简紧凑',
    description: '适合高频通知，减少视觉负担。',
    category: 'minimal',
    card: {
      header: {
        title: { tag: 'plain_text', content: '新邮件' },
        template: 'grey'
      },
      elements: [
        {
          tag: 'div',
          text: { tag: 'lark_md', content: '{subject}\n`{from}` · {time}' }
        }
      ]
    }
  }
]

export function renderFeishuPresetContent(presetId: string): string | null {
  const preset = feishuCardPresets.find((item) => item.id === presetId)
  if (!preset) return null
  return JSON.stringify(preset.card)
}
