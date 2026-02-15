'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Globe,
  Mail,
  Upload,
  KeyRound,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { api } from '@/lib/api-client'
import { useToast } from '@/components/ui/toast'

interface UserProfile {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  twoFactorEnabled: boolean
  createdAt: string
}

interface SettingsResponse {
  profile: UserProfile
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    soundEnabled: boolean
    quietHoursStart: string | null
    quietHoursEnd: string | null
  }
  rateLimit: { maxPerMinute: number; maxPerHour: number }
  security: { twoFactorEnabled: boolean; sessionTimeout: number }
  general: { language: string; timezone: string; dateFormat: string }
}

interface TwoFactorStatus {
  enabled: boolean
  hasPendingSetup: boolean
  recoveryCodesLeft: number
  verifiedAt: string | null
}

interface FeishuPreset {
  id: string
  name: string
  description: string
  category: 'business' | 'alert' | 'minimal'
  card: Record<string, unknown>
}

interface PushChannel {
  id: string
  name: string
  type: string
}

interface EmailAccount {
  id: string
  email: string
}

function FeishuPreview({ card }: { card: Record<string, unknown> }) {
  const header = card.header as { title?: { content?: string } } | undefined
  const elements = (card.elements as Array<Record<string, unknown>> | undefined) || []
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 text-white text-sm">
        {header?.title?.content || '飞书卡片'}
      </div>
      <div className="p-4 space-y-2">
        {elements.map((element, idx) => {
          const text = element.text as { content?: string } | undefined
          if (text?.content) {
            return <div key={idx} className="text-sm whitespace-pre-wrap">{text.content}</div>
          }
          if (element.tag === 'hr') return <hr key={idx} className="border-border" />
          return <div key={idx} className="text-xs text-muted-foreground">[{String(element.tag || 'element')}]</div>
        })}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [presets, setPresets] = useState<FeishuPreset[]>([])
  const [channels, setChannels] = useState<PushChannel[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])

  const [profileForm, setProfileForm] = useState({
    name: '',
    avatarUrl: '' as string | null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  })
  const [rateLimit, setRateLimit] = useState({ maxPerMinute: 10, maxPerHour: 100 })
  const [security, setSecurity] = useState({ sessionTimeout: 30 })
  const [general, setGeneral] = useState({
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD'
  })

  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    qrCodeDataUrl: string
    secret: string
    recoveryCodes: string[]
  } | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')

  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [applyScope, setApplyScope] = useState<'global' | string>('global')
  const [applyChannelId, setApplyChannelId] = useState('')

  const selectedPreset = useMemo(() => presets.find((preset) => preset.id === selectedPresetId) || null, [presets, selectedPresetId])
  const feishuChannels = useMemo(() => channels.filter((channel) => channel.type === 'feishu'), [channels])

  const refreshAll = async () => {
    try {
      setLoading(true)
      const [settingsData, twoFaData, presetData, accountData, channelData] = await Promise.all([
        api.get<SettingsResponse>('/api/settings'),
        api.get<TwoFactorStatus>('/api/settings/2fa'),
        api.get<{ presets: FeishuPreset[] }>('/api/feishu-templates'),
        api.get<EmailAccount[]>('/api/email-accounts'),
        api.get<PushChannel[]>('/api/push-channels')
      ])

      setProfile(settingsData.profile)
      setProfileForm((prev) => ({
        ...prev,
        name: settingsData.profile.name || '',
        avatarUrl: settingsData.profile.avatarUrl
      }))
      setNotifications({
        ...settingsData.notifications,
        quietHoursStart: settingsData.notifications.quietHoursStart || '22:00',
        quietHoursEnd: settingsData.notifications.quietHoursEnd || '08:00'
      })
      setRateLimit(settingsData.rateLimit)
      setSecurity({ sessionTimeout: settingsData.security.sessionTimeout })
      setGeneral(settingsData.general)
      setTwoFactorStatus(twoFaData)
      setPresets(presetData.presets)
      setAccounts(accountData)
      setChannels(channelData)
      if (!selectedPresetId && presetData.presets.length) {
        setSelectedPresetId(presetData.presets[0].id)
      }
    } catch (error) {
      console.error(error)
      showToast('error', '设置加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshAll()
  }, [])

  const saveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      showToast('error', '新密码与确认密码不一致')
      return
    }
    try {
      setSaving(true)
      const payload: Record<string, unknown> = {
        name: profileForm.name.trim() ? profileForm.name.trim() : null,
        avatarUrl: profileForm.avatarUrl
      }
      if (profileForm.newPassword) {
        payload.currentPassword = profileForm.currentPassword
        payload.newPassword = profileForm.newPassword
      }
      const updated = await api.patch<UserProfile>('/api/settings', payload)
      setProfile(updated)
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))

      const localUser = localStorage.getItem('user')
      if (localUser) {
        const parsed = JSON.parse(localUser) as Record<string, unknown>
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated }))
        window.dispatchEvent(new Event('user-updated'))
      }
      showToast('success', '个人资料已更新')
    } catch {
      showToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const saveNotificationTab = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', { ...notifications, ...rateLimit })
      showToast('success', '通知设置已保存')
    } catch {
      showToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const saveSecurity = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', { sessionTimeout: security.sessionTimeout })
      showToast('success', '安全设置已保存')
    } catch {
      showToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const saveAppearance = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', general)
      showToast('success', '界面设置已保存')
    } catch {
      showToast('error', '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('error', '请选择图片文件')
      return
    }
    if (file.size > 1024 * 1024) {
      showToast('error', '头像文件需要小于 1MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProfileForm((prev) => ({ ...prev, avatarUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const setup2FA = async () => {
    try {
      const data = await api.post<{ qrCodeDataUrl: string; secret: string; recoveryCodes: string[] }>('/api/settings/2fa', { action: 'setup' })
      setTwoFactorSetup(data)
      setTwoFactorCode('')
      showToast('success', '2FA 密钥已生成')
    } catch {
      showToast('error', '2FA 初始化失败')
    }
  }

  const enable2FA = async () => {
    try {
      await api.post('/api/settings/2fa', { action: 'enable', code: twoFactorCode })
      setTwoFactorSetup(null)
      setTwoFactorCode('')
      await refreshAll()
      showToast('success', '2FA 已启用')
    } catch {
      showToast('error', '验证码错误')
    }
  }

  const disable2FA = async () => {
    try {
      await api.post('/api/settings/2fa', {
        action: 'disable',
        code: disableCode,
        password: disablePassword
      })
      setDisableCode('')
      setDisablePassword('')
      await refreshAll()
      showToast('success', '2FA 已关闭')
    } catch {
      showToast('error', '停用失败')
    }
  }

  const regenerateCodes = async () => {
    try {
      const data = await api.post<{ recoveryCodes: string[] }>('/api/settings/2fa', {
        action: 'regenerateRecoveryCodes',
        code: disableCode
      })
      setTwoFactorSetup((prev) => prev ? { ...prev, recoveryCodes: data.recoveryCodes } : {
        qrCodeDataUrl: '',
        secret: '',
        recoveryCodes: data.recoveryCodes
      })
      showToast('success', '恢复码已重置')
      await refreshAll()
    } catch {
      showToast('error', '恢复码重置失败')
    }
  }

  const applyPreset = async () => {
    if (!selectedPresetId) return
    try {
      await api.post('/api/feishu-templates', {
        presetId: selectedPresetId,
        emailAccountId: applyScope === 'global' ? null : applyScope,
        channelId: applyChannelId || undefined,
        setAsDefault: true
      })
      showToast('success', '飞书模板已应用')
    } catch {
      showToast('error', '模板应用失败')
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">加载中...</div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">设置</h1>
        <p className="text-muted-foreground">管理个人资料、通知、安全与界面设置</p>
      </div>

      <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl mb-8 w-fit border border-border">
        {[{ id: 'profile', label: '个人资料', icon: User }, { id: 'notifications', label: '消息通知', icon: Bell }, { id: 'security', label: '安全设置', icon: Shield }, { id: 'appearance', label: '界面显示', icon: Globe }].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-background text-primary shadow-sm border border-border' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
          <div className="flex items-center gap-6 mb-8 border-b border-border pb-8">
            <div className="relative">
              {profileForm.avatarUrl ? (
                <img src={profileForm.avatarUrl} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border border-border" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{profile?.name || '未设置用户名'}</h3>
              <p className="text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <input value={profileForm.name} onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="用户名" className="px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
            <input value={profile?.email || ''} disabled className="px-4 py-3 bg-secondary/30 border border-border rounded-lg text-muted-foreground" />
            <input type="password" value={profileForm.currentPassword} onChange={(e) => setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))} placeholder="当前密码（选填）" className="md:col-span-2 px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
            <input type="password" value={profileForm.newPassword} onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))} placeholder="新密码" className="px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
            <input type="password" value={profileForm.confirmPassword} onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} placeholder="确认新密码" className="px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={() => void saveProfile()} disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6">通知偏好</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={notifications.emailNotifications} onChange={(e) => setNotifications((prev) => ({ ...prev, emailNotifications: e.target.checked }))} />邮件通知</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={notifications.pushNotifications} onChange={(e) => setNotifications((prev) => ({ ...prev, pushNotifications: e.target.checked }))} />推送通知</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={notifications.soundEnabled} onChange={(e) => setNotifications((prev) => ({ ...prev, soundEnabled: e.target.checked }))} />声音提示</label>
              <input type="time" value={notifications.quietHoursStart || ''} onChange={(e) => setNotifications((prev) => ({ ...prev, quietHoursStart: e.target.value }))} className="px-4 py-2 bg-secondary/50 border border-border rounded-lg" />
              <input type="time" value={notifications.quietHoursEnd || ''} onChange={(e) => setNotifications((prev) => ({ ...prev, quietHoursEnd: e.target.value }))} className="px-4 py-2 bg-secondary/50 border border-border rounded-lg" />
              <input type="number" value={rateLimit.maxPerMinute} onChange={(e) => setRateLimit((prev) => ({ ...prev, maxPerMinute: parseInt(e.target.value, 10) || 10 }))} className="px-4 py-2 bg-secondary/50 border border-border rounded-lg" />
              <input type="number" value={rateLimit.maxPerHour} onChange={(e) => setRateLimit((prev) => ({ ...prev, maxPerHour: parseInt(e.target.value, 10) || 100 }))} className="px-4 py-2 bg-secondary/50 border border-border rounded-lg" />
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => void saveNotificationTab()} disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
                {saving ? '保存中...' : '保存通知设置'}
              </button>
            </div>
          </div>

          <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4">飞书卡片模板</h3>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
                  {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} - {preset.description}</option>)}
                </select>
                <select value={applyScope} onChange={(e) => setApplyScope(e.target.value as 'global' | string)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
                  <option value="global">全局</option>
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.email}</option>)}
                </select>
                <select value={applyChannelId} onChange={(e) => setApplyChannelId(e.target.value)} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
                  <option value="">仅创建模板，不绑定渠道</option>
                  {feishuChannels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                </select>
                <button onClick={() => void applyPreset()} className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium">一键应用</button>
              </div>
              <div>{selectedPreset ? <FeishuPreview card={selectedPreset.card} /> : <div className="text-sm text-muted-foreground">请选择模板</div>}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-background rounded-2xl border border-border p-8 shadow-sm space-y-6">
          <div className="p-4 border border-border rounded-xl bg-secondary/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" />Google 二次验证（2FA）</h4>
                <p className="text-sm text-muted-foreground mt-1">{twoFactorStatus?.enabled ? '已启用，登录时需要动态验证码' : '未启用，建议开启提升账号安全'}</p>
                {twoFactorStatus?.enabled && <p className="text-xs text-muted-foreground mt-1">恢复码剩余：{twoFactorStatus.recoveryCodesLeft}</p>}
              </div>
              {!twoFactorStatus?.enabled ? (
                <button onClick={() => void setup2FA()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">开始绑定</button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle2 className="w-4 h-4" />已启用</div>
              )}
            </div>
          </div>

          {twoFactorSetup && (
            <div className="p-4 border border-border rounded-xl space-y-4">
              {twoFactorSetup.qrCodeDataUrl && <img src={twoFactorSetup.qrCodeDataUrl} alt="2FA QR" className="w-44 h-44 border border-border rounded-lg" />}
              <div className="text-sm">密钥：<code className="font-mono">{twoFactorSetup.secret}</code></div>
              <input value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="输入6位验证码" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
              <button onClick={() => void enable2FA()} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl">验证并启用</button>
              {!!twoFactorSetup.recoveryCodes.length && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-amber-500" />请保存恢复码（仅显示一次）</p>
                  <div className="grid grid-cols-2 gap-2">{twoFactorSetup.recoveryCodes.map((code) => <code key={code} className="text-xs px-2 py-1 bg-background border border-border rounded">{code}</code>)}</div>
                </div>
              )}
            </div>
          )}

          {twoFactorStatus?.enabled && (
            <div className="p-4 border border-border rounded-xl space-y-3">
              <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="当前登录密码" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
              <input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="动态码或恢复码" className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
              <div className="flex gap-3">
                <button onClick={() => void regenerateCodes()} className="px-4 py-2 bg-secondary rounded-lg text-sm">重置恢复码</button>
                <button onClick={() => void disable2FA()} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm">停用 2FA</button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">会话超时时间（分钟）</label>
            <input type="number" value={security.sessionTimeout} onChange={(e) => setSecurity({ sessionTimeout: parseInt(e.target.value, 10) || 30 })} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg" />
          </div>

          <div className="flex justify-end">
            <button onClick={() => void saveSecurity()} disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium">{saving ? '保存中...' : '保存安全设置'}</button>
          </div>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
          <div className="space-y-6">
            <select value={general.language} onChange={(e) => setGeneral((prev) => ({ ...prev, language: e.target.value }))} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
            <select value={general.timezone} onChange={(e) => setGeneral((prev) => ({ ...prev, timezone: e.target.value }))} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
              <option value="Asia/Shanghai">Asia/Shanghai</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
            </select>
            <select value={general.dateFormat} onChange={(e) => setGeneral((prev) => ({ ...prev, dateFormat: e.target.value }))} className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg">
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            </select>
          </div>
          <div className="mt-8 flex justify-end">
            <button onClick={() => void saveAppearance()} disabled={saving} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium">{saving ? '保存中...' : '保存界面设置'}</button>
          </div>
        </div>
      )}
    </div>
  )
}
