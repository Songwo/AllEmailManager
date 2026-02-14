'use client'

import { motion } from 'framer-motion'
import { User, Bell, Shield, Globe, Mail, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface Settings {
  profile: UserProfile;
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  };
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
  };
  general: {
    language: string;
    timezone: string;
    dateFormat: string;
  };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    quietHoursStart: '' as string | null,
    quietHoursEnd: '' as string | null
  })

  const [rateLimit, setRateLimit] = useState({
    maxPerMinute: 10,
    maxPerHour: 100
  })

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 3600
  })

  const [general, setGeneral] = useState({
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD'
  })

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await api.get<Settings>('/api/settings')
        setProfile(data.profile)
        setProfileForm({ ...profileForm, name: data.profile.name || '' })
        setNotifications(data.notifications)
        setRateLimit(data.rateLimit)
        setSecurity(data.security)
        setGeneral(data.general)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  // Save profile
  const handleSaveProfile = async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      alert('新密码与确认密码不一致')
      return
    }

    try {
      setSaving(true)
      const updateData: any = { name: profileForm.name }
      if (profileForm.newPassword) {
        updateData.currentPassword = profileForm.currentPassword
        updateData.newPassword = profileForm.newPassword
      }

      const updatedProfile = await api.patch<UserProfile>('/api/settings', updateData)
      setProfile(updatedProfile)
      setProfileForm({ ...profileForm, currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('个人资料已更新')
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save notifications
  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', notifications)
      alert('通知设置已保存')
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save security
  const handleSaveSecurity = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', security)
      alert('安全设置已保存')
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Save general
  const handleSaveGeneral = async () => {
    try {
      setSaving(true)
      await api.post('/api/settings', general)
      alert('界面设置已保存')
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">加载失败: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
          设置
        </h1>
        <p className="text-muted-foreground">
          管理个人资料、全局偏好设置和消息通知
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-xl mb-8 w-fit border border-border">
        {[
          { id: 'profile', label: '个人资料', icon: User },
          { id: 'notifications', label: '消息通知', icon: Bell },
          { id: 'security', label: '安全设置', icon: Shield },
          { id: 'appearance', label: '界面显示', icon: Globe }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-background text-primary shadow-sm border border-border'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl space-y-8 text-foreground">
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-background rounded-2xl border border-border p-8 shadow-sm">
              <div className="flex items-center gap-6 mb-8 border-b border-border pb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <Mail className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{profile?.name || '未设置用户名'}</h3>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">用户名</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">主邮箱</label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-lg text-muted-foreground ml-0 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-border">
                <h4 className="text-lg font-semibold mb-4">修改密码</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">当前密码</label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">新密码</label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">确认新密码</label>
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存更改'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl border border-border p-8 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-6">通知偏好</h3>
            <div className="space-y-6">
              {[
                { id: 'emailNotifications', label: '邮件通知', desc: '接收邮件相关的通知' },
                { id: 'pushNotifications', label: '推送通知', desc: '新邮件到达时推送通知' },
                { id: 'soundEnabled', label: '声音提示', desc: '通知时播放提示音' }
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                  <div>
                    <h4 className="font-semibold">{item.label}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({
                      ...notifications,
                      [item.id]: !notifications[item.id as keyof typeof notifications]
                    })}
                    className={`w-14 h-8 rounded-full transition-all relative ${notifications[item.id as keyof typeof notifications] ? 'bg-primary' : 'bg-secondary'
                      }`}
                  >
                    <motion.div
                      animate={{ x: notifications[item.id as keyof typeof notifications] ? 28 : 4 }}
                      className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm"
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-lg font-semibold mb-4">免打扰时段</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">开始时间</label>
                  <input
                    type="time"
                    value={notifications.quietHoursStart || ''}
                    onChange={(e) => setNotifications({ ...notifications, quietHoursStart: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">结束时间</label>
                  <input
                    type="time"
                    value={notifications.quietHoursEnd || ''}
                    onChange={(e) => setNotifications({ ...notifications, quietHoursEnd: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="text-lg font-semibold mb-4">推送频率限制</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">每分钟最多推送</label>
                  <input
                    type="number"
                    value={rateLimit.maxPerMinute}
                    onChange={(e) => setRateLimit({ ...rateLimit, maxPerMinute: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">每小时最多推送</label>
                  <input
                    type="number"
                    value={rateLimit.maxPerHour}
                    onChange={(e) => setRateLimit({ ...rateLimit, maxPerHour: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveNotifications}
                disabled={saving}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存更改'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl border border-border p-8 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-6">安全设置</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <h4 className="font-semibold">双因素认证</h4>
                  <p className="text-sm text-muted-foreground">增强账户安全性</p>
                </div>
                <button
                  onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                  className={`w-14 h-8 rounded-full transition-all relative ${security.twoFactorEnabled ? 'bg-primary' : 'bg-secondary'}`}
                >
                  <motion.div
                    animate={{ x: security.twoFactorEnabled ? 28 : 4 }}
                    className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-sm"
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">会话超时时间（秒）</label>
                <input
                  type="number"
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 3600 })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground ml-0"
                />
                <p className="text-sm text-muted-foreground mt-2">默认 3600 秒（1 小时）</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSecurity}
                disabled={saving}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存更改'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {activeTab === 'appearance' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl border border-border p-8 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-6">界面显示</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">语言</label>
                <select
                  value={general.language}
                  onChange={(e) => setGeneral({ ...general, language: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">时区</label>
                <select
                  value={general.timezone}
                  onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="America/New_York">America/New_York (UTC-5)</option>
                  <option value="Europe/London">Europe/London (UTC+0)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">日期格式</label>
                <select
                  value={general.dateFormat}
                  onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveGeneral}
                disabled={saving}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存更改'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
