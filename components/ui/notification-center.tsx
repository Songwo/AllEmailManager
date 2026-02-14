'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import { api } from '@/lib/api-client'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

interface NotificationResponse {
  items: NotificationItem[]
  unreadCount: number
}

function typeIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'success':
      return <CircleCheck className="w-4 h-4 text-emerald-600" />
    case 'warning':
      return <CircleAlert className="w-4 h-4 text-amber-500" />
    case 'error':
      return <CircleX className="w-4 h-4 text-destructive" />
    default:
      return <Info className="w-4 h-4 text-sky-500" />
  }
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<NotificationResponse>('/api/notifications?limit=20')
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const timer = setInterval(fetchNotifications, 30000)
    return () => clearInterval(timer)
  }, [fetchNotifications])

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [])

  const markRead = async (id: string) => {
    try {
      await api.patch('/api/notifications', { id })
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, isRead: true } : item))
      setUnreadCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications', { markAllRead: true })
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary transition-colors relative"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-white text-[10px] leading-4 text-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] bg-background border border-border rounded-xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-sm">消息中心</h4>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
              </p>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs px-2 py-1 rounded-md hover:bg-secondary disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              全部已读
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">加载中...</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">暂无消息</div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!item.isRead) {
                        void markRead(item.id)
                      }
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors ${
                      item.isRead ? '' : 'bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{typeIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">{item.title}</span>
                          {!item.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-words">
                          {item.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
