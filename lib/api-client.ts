/**
 * 统一 API 客户端
 * - 自动附加 Authorization header
 * - 401 时跳转登录页
 * - 统一错误处理
 * - 集成 Toast 通知
 */

class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.status = status
    }
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
}

// Toast notification function (will be set by ToastProvider)
let toastFn: ((type: 'success' | 'error' | 'warning' | 'info', message: string) => void) | null = null

export function setToastFunction(fn: typeof toastFn) {
    toastFn = fn
}

async function request<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const res = await fetch(url, { ...options, headers })

        if (res.status === 401) {
            // Clear auth state and redirect
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            if (toastFn) {
                toastFn('error', '登录已过期，请重新登录')
            }
            window.location.href = '/login'
            throw new ApiError('登录已过期，请重新登录', 401)
        }

        const data = await res.json()

        if (!res.ok) {
            const errorMessage = data.error || `请求失败 (${res.status})`
            if (toastFn) {
                toastFn('error', errorMessage)
            }
            throw new ApiError(errorMessage, res.status)
        }

        return data as T
    } catch (error) {
        if (error instanceof ApiError) {
            throw error
        }
        const errorMessage = error instanceof Error ? error.message : '网络请求失败'
        if (toastFn) {
            toastFn('error', errorMessage)
        }
        throw new ApiError(errorMessage, 0)
    }
}

export const api = {
    get: <T>(url: string) => request<T>(url),

    post: <T>(url: string, body?: unknown) =>
        request<T>(url, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),

    patch: <T>(url: string, body: unknown) =>
        request<T>(url, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }),

    delete: <T>(url: string) =>
        request<T>(url, { method: 'DELETE' }),
}

export { ApiError }
