import { describe, expect, it } from '@jest/globals'
import { feishuCardPresets, renderFeishuPresetContent } from '@/lib/feishu-card-templates'

describe('feishu card presets', () => {
  it('should provide built-in presets', () => {
    expect(feishuCardPresets.length).toBeGreaterThanOrEqual(3)
  })

  it('should render preset content as JSON string', () => {
    const preset = feishuCardPresets[0]
    const content = renderFeishuPresetContent(preset.id)
    expect(content).not.toBeNull()
    expect(() => JSON.parse(content || '')).not.toThrow()
  })

  it('should return null for unknown preset', () => {
    const content = renderFeishuPresetContent('not-exists')
    expect(content).toBeNull()
  })
})
