'use client'

import { Mail, Plus, Settings, Bell, Filter, TrendingUp, Search, Menu, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<{ name: string, email: string } | null>(null)

    useEffect(() => {
        const userData = localStorage.getItem('user')
        if (!userData) {
            router.push('/login')
        } else {
            try {
                setUser(JSON.parse(userData))
            } catch (e) {
                console.error("Failed to parse user data", e);
                router.push('/login')
            }
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('user')
        router.push('/')
    }

    const navItems = [
        { icon: Mail, label: '邮件列表', href: '/dashboard' },
        { icon: TrendingUp, label: '统计分析', href: '/dashboard/analytics' },
    ]

    const configItems = [
        { icon: Plus, label: '邮箱管理', href: '/dashboard/accounts' },
        { icon: Bell, label: '推送渠道', href: '/dashboard/channels' },
        { icon: Filter, label: '过滤规则', href: '/dashboard/filters' },
        { icon: Settings, label: '系统设置', href: '/dashboard/settings' }
    ]

    return (
        <div className="min-h-screen bg-muted/30 flex text-foreground selection:bg-zinc-900 selection:text-zinc-50 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border p-4 flex flex-col z-20">
                <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">
                        EmailHub
                    </span>
                </Link>

                <div className="space-y-1 flex-1">
                    <p className="px-2 text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">概览</p>
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-secondary text-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}

                    <p className="px-2 text-xs font-medium text-muted-foreground mb-2 mt-6 uppercase tracking-wider">配置</p>
                    {configItems.map((item, index) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href)
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-secondary text-foreground'
                                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="退出登录"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="ml-64 flex-1 p-8">
                {/* Header (Optional, or part of children) */}
                <div className="flex items-center justify-end mb-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="搜索..."
                                className="pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
                            />
                        </div>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary transition-colors">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {children}
            </main>
        </div>
    )
}
